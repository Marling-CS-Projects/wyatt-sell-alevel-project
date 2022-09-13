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
	getBoxPoints,
	dimensions,
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
	const {width, height} = dimensions(result.data.options.vertices);
	if (width * height > 50 * 1000 ** 2)
		return res.status(400).send(JSON.stringify({data: 'Map is too large'}));

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

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
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
	if ([...allSockets.values()].filter(s => s.user.sub === socket.user.sub).length) {
		return next({
			name: 'DuplicateConnection',
			message: "You're already connected",
		});
	}
	next();
});

io.use((socket, next) => {
	const gameCode = socket.handshake.query['code'] as string;
	const matchingGame = games.find(g => g.joinCode === gameCode);
	if (!matchingGame)
		return next({
			name: 'InvalidGameCode',
			message: 'No game with this game code exists',
		});

	if (matchingGame.hasStarted) {
		const playerInGame = matchingGame.players.find(p => p.id === socket.user.sub);
		if (!playerInGame) {
			return next({
				name: 'GameAlreadyStarted',
				message: 'This game has already started',
			});
		} else {
			playerInGame.status = 'alive';
			socket.player = playerInGame;
			playerInGame.socket = socket;
		}
	} else if (matchingGame.options.max.total! > matchingGame.players.length) {
		const player = new Player(socket, matchingGame);
		socket.player = player;
	} else {
		return next({
			name: 'GameFull',
			message: 'This game is full',
		});
	}

	socket.game = matchingGame;
	next();
});

// This is a function to transmit connection and disconnection events
io.on('connection', async socket => {
	socket.game.sendGameData(socket.player.id);

	socket.on('player-pref', async data => {
		socket.player.updatePref(data);
	});

	socket.on('player-location', async data => {
		socket.player.updateLocation(data);
	});

	socket.on('player-catch', async data => {
		socket.player.catchPlayer(data);
	});

	socket.on('item-pickup', async data => {
		socket.player.pickupItem(data.id);
	});

	socket.on('item-drop', async data => {
		socket.player.dropItem(data);
	});

	socket.on('disconnect', () => {
		socket.player.disconnect();
		socket.disconnect(true);
		if (socket.game.players.filter(p => p.socket.connected).length === 0) {
			games = games.filter(g => g.id !== socket.game.id);
		}
	});
});
