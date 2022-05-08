import 'dotenv/config';
import {Server} from 'socket.io';
import {env} from './utils/env';
import {createServer} from 'http';
import express from 'express';
import cors from 'cors';
import jwksClient from 'jwks-rsa';
import {authorize} from '@thream/socketio-jwt';
import 'express-oauth2-jwt-bearer';
import {expressjwt, GetVerificationKey} from 'express-jwt';

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

const socket = new Server(server, {
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

socket.on('disconnect', socket => {
	console.log('disconnect', socket.id);
});

socket.use(
	authorize({
		secret: async decodedToken => {
			const key = await client.getSigningKey(decodedToken.header.kid);
			return key.getPublicKey();
		},
		algorithms: ['RS256'],
	})
);

// This is a function to send test data to the client
socket.on('connection', socket => {
	const user = socket.decodedToken;
	console.log('Client connected', user.name);
	socket.send(`Hello ${user.name}`);
	let i = 0;
	setInterval(() => {
		socket.send('message ' + i++);
	}, 1000);
});
