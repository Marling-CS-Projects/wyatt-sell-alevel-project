import 'dotenv/config';
import {Server, Socket} from 'socket.io';
import {env} from './utils/env';
import {createServer} from 'http';
import express from 'express';
import cors from 'cors';
import jwksClient from 'jwks-rsa';
import 'express-oauth2-jwt-bearer';
import {expressjwt, GetVerificationKey} from 'express-jwt';
import {authorize} from '@thream/socketio-jwt';
import {userType} from './types';
import {
	ServerToClientEvents,
	ClientToServerEvents,
} from '@monorepo/shared/src/index';
import {Player} from './classes/player';
import {Game} from './classes/game';

declare module 'socket.io' {
	interface Socket {
		user: userType;
		player: Player;
	}
}

const app = express();
const server = createServer(app);

const client = jwksClient({
	jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

app.use(
	cors({
		origin: env.CLIENT_ORIGIN,
		credentials: true,
	})
);

const checkJwt = expressjwt({
	secret: jwksClient.expressJwtSecret({
		cache: true,
		rateLimit: true,
		jwksRequestsPerMinute: 5,
		jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
	}) as GetVerificationKey,

	algorithms: ['RS256'],
});

app.get('/user', checkJwt, (req, res) => {
	res.send(JSON.stringify(req.auth));
});

app.get('/', (req, res) => {
	res.redirect(env.CLIENT_ORIGIN);
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

const games: Game[] = [];

io.use((socket, next) => {
	if (!games.length || games.every(g => g.hasStarted)) {
		games.push(new Game());
	}
	const player = new Player(socket, games[games.length - 1]);
	socket.player = player;
	next();
});

// This is a function to transmit connection and disconnection events
io.on('connection', async socket => {
	io.emit('user-connected', {
		id: socket.user.sub,
		username: socket.user.given_name,
		picture: socket.user.picture,
		type: socket.player.type,
	});

	for (const [id, s] of io.of('/').sockets) {
		if (id === socket.id || !s.connected) continue;

		socket.emit('user-connected', {
			id: s.user.sub,
			username: s.user.given_name,
			picture: s.user.picture,
			type: s.player.type,
		});
	}

	socket.on('disconnect', () => {
		io.emit('user-disconnected', {id: socket.user.sub});
	});
	socket.on('player-pref', async data => {
		const type = socket.player.updatePref(data);
		io.emit('user-updated', {
			type: 'type',
			data: {id: socket.player.id, type: type},
		});
	});
});
