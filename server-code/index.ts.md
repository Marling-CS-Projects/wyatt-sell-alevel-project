# index.ts

```typescript
import 'dotenv/config';
import {prisma} from './prisma';
import {redis} from './utils/redis';
import {Server} from 'socket.io';
import {env} from './utils/env';
import {createServer} from 'http';
import express from 'express';
import cors from 'cors';

const app = express();
const server = createServer(app);

const socket = new Server(server, {
	cors: {
		origin: env.CLIENT_ORIGIN,
		methods: ['GET', 'POST'],
	},
});

app.use(
	cors({
		origin: env.CLIENT_ORIGIN,
		credentials: true,
	})
);

const start = async () => {
	await prisma.$connect();
	await redis.connect();
	await server.listen(env.PORT, () => {
		console.log(`Listening on port ${env.PORT}`);
	});
};

void start();

// This is a function to send test data to the client
socket.on('connection', socket => {
	socket.send('Hello world');
	let i = 0;
	setInterval(() => {
		socket.send('message ' + i++);
	}, 1000);
});e
```

