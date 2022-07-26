import 'dotenv/config';
import {Server, Socket} from 'socket.io';
import {env} from './utils/env';
import {createServer} from 'http';
import express from 'express';
import cors from 'cors';
import jwksClient from 'jwks-rsa';
import {expressjwt, GetVerificationKey} from 'express-jwt';
import {authorize} from '@thream/socketio-jwt';
import {userType} from './types';
import {
	ServerToClientEvents,
	ClientToServerEvents,
} from '@monorepo/shared/src/index';
import {Player} from './classes/player';
import {Game} from './classes/game';
import {createSchema} from '@monorepo/shared/src/schemas/connection';
import * as http from 'http';
import {JwtPayload} from 'jsonwebtoken';

declare module 'socket.io' {
	interface Socket {
		user: userType;
		player: Player;
		game: Game;
	}
}

declare module 'express-serve-static-core' {
	interface Request {
		auth: JwtPayload;
		game: Game;
		player: Player;
	}
}

const app = express();
const server = createServer(app);

let games: Game[] = [];

const client = jwksClient({
	jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

app.use(
	cors({
		origin: env.CLIENT_ORIGIN,
		credentials: true,
	})
);

app.use((req, res, next) => {
	express.json({
		verify: (
			req: http.IncomingMessage & {rawBody: Buffer},
			res: http.ServerResponse,
			buf: Buffer
		) => {
			req.rawBody = buf;
		},
	})(req, res, err => {
		if (err) {
			console.error(err);
			res.sendStatus(400);
			return;
		}
		next();
	});
});

app.use(
	expressjwt({
		secret: jwksClient.expressJwtSecret({
			cache: true,
			rateLimit: true,
			jwksRequestsPerMinute: 5,
			jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
		}) as GetVerificationKey,
		algorithms: ['RS256'],
	})
);

app.get('/user', (req, res) => {
	res.send(JSON.stringify(req.auth));
});

app.post('/create', (req, res) => {
	const result = createSchema.safeParse(req.body);
	if (!result.success) return res.status(400).send(result.error);
	const game = new Game(result.data.options);
	games.push(game);
	res.send(JSON.stringify({code: game.joinCode}));
});

app.use((req, res, next) => {
	const player = games.flatMap(g => g.players).find(p => p.id === req.auth.sub);
	if (!player) {
		console.error('No player found');
		res.sendStatus(400);
		return;
	}
	req.player = player;
	req.game = player.game;
	next();
});

app.post('/start', (req, res) => {
	req.game.start();
	res.send(JSON.stringify({code: 200}));
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
	cors: {
		origin: env.CLIENT_ORIGIN,
		methods: ['GET', 'POST'],
	},
});

const start = async () => {
	// await prisma.$connect();
	// await redis.connect();
	await server.listen(env.PORT, () => {
		console.log(`Listening on port ${env.PORT}`);
	});
};

void start();

io.use(
	authorize({
		secret: async decodedToken => {
			const key = await client.getSigningKey(decodedToken.header.kid);
			return key.getPublicKey();
		},
		algorithms: ['RS256'],
	})
);

io.use((socket, next) => {
	socket.user = socket.decodedToken;
	// Ensure no duplicate connections
	const allSockets = io.sockets.sockets;
	if (
		[...allSockets.values()].filter(s => s.user.sub === socket.user.sub).length
	) {
		return next({
			name: 'DuplicateConnection',
			message: "You're already connected",
		});
	}
	next();
});

io.use((socket, next) => {
	// TODO: Add validation here, and throw error if invalid code
	const gameCode = socket.handshake.query['code'] as string;
	const matchingGame = games.find(g => g.joinCode === gameCode);
	if (!matchingGame)
		return next({
			name: 'InvalidGameCode',
			message: 'No game with this game code exists',
		});
	// TODO: Implement rejoin logic here
	if (matchingGame.hasStarted) {
		return next({
			name: 'GameAlreadyStarted',
			message: 'This game has already started',
		});
	}

	const player = new Player(socket, matchingGame);
	socket.player = player;
	socket.game = matchingGame;
	next();
});

// This is a function to transmit connection and disconnection events
io.on('connection', async socket => {
	io.emit('game-init', {
		id: socket.game.id,
		code: socket.game.joinCode,
		options: socket.game.options,
		hasStarted: socket.game.hasStarted,
	});

	// Tells all users in game that a new user connected
	io.to(socket.game.id).emit('player-connected', {
		id: socket.user.sub,
		username: socket.user.given_name,
		picture: socket.user.picture,
		type: socket.player.type,
		isHost: socket.player.isHost,
	});

	// Sends already connected users to new user
	for (const {id, user, type, socket: s, ...player} of socket.game.players) {
		if (id === socket.player.id || !s.connected) continue;

		socket.emit('player-connected', {
			id: user.sub,
			username: user.given_name,
			picture: user.picture,
			type,
			isHost: player.isHost,
			location:
				socket.player.type === 'hunter' && socket.player.type === type
					? player.location
					: undefined,
		});
	}

	socket.on('disconnect', () => {
		io.emit('player-disconnected', {id: socket.user.sub});
		if (socket.game.players.filter(p => p.socket.connected).length === 0) {
			games = games.filter(g => g.id !== socket.game.id);
		}
	});

	socket.on('player-pref', async data => {
		const type = socket.player.updatePref(data);
		io.emit('player-updated', {
			id: socket.player.id,
			type,
		});
		if (socket.player.type === 'hunter') {
			socket.to(socket.game.id + 'hunter').emit('player-location', {
				id: socket.player.id,
				location: socket.player.location,
			});
		}
	});

	socket.on('player-location', async data => {
		socket.player.location = data;
		if (socket.player.type === 'hunter') {
			socket.to(socket.game.id + 'hunter').emit('player-location', {
				id: socket.player.id,
				location: data,
			});
		}
	});
});
