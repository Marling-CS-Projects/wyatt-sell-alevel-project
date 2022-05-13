# 2.2.1 Cycle 1

## Design

### Objectives

In this cycle, I aim to setup and configure my project, in the form of a monorepo. A monorepo is a codebase structure where the code for multiple elements of a project are stored in the same Github repository. I chose to use a monorepo configuration, as it allows for sharing of types and schemas between the client and the server code. This would ensure two way validation of requests, and ensuring continuity between all modules within my project.

* [x] Configure a \`yarn\` monorepo with a [Socket.IO](https://socket.io/) server and a [Next.js](https://nextjs.org/) (with API authentication routes) client configured
* [x] Create a shared "package" which can be imported and used in both the server and the client
* [x] Install and setup [Prisma](https://www.prisma.io/) to allow for interaction with a database within Typescript.
* [x] Configure a build flow, using [TSC](https://www.typescriptlang.org/), [Preconstruct](https://preconstruct.tools/) and [Prisma deployments](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-deploy)
* [x] Created a docker-compose file that contains [PostgreSQL](https://www.postgresql.org/) and [Redis](https://redis.io/) Docker containers

### Usability Features

### Key Variables

| Variable Name | Use                                                                                    |
| ------------- | -------------------------------------------------------------------------------------- |
| redis         | Initialises a connection to Redis                                                      |
| env           | An object which contains validated environment variables (i.e. PORT, REDIS\_URL, etc.) |
| server        | The base http web server that allows a Socket.io websocket to mount on it              |
| socket        | Initialises a websocket server                                                         |

### Pseudocode

```
procedure start_server
    connect_to_prisma()
    connect_to_redis()
    server_listen(port)
end start_server

procedure socket_on_connect
    // Implement authentication and message flows
end socket_on_connect
```

## Development

### Outcome

#### Server

In \`index.ts\` in the server directory, I configured a websocket server, using [Socket.IO](https://socket.io/), with an [Express.js](https://expressjs.com/) server object as the mount point. Additionally, I made sure to initialise connections to:

* Redis: A caching solution that avoids costly I/O operations on a database, when unnecessary.
* Prisma: A typed ORM (Object Relational Mapping) that enables easy interaction with my PostgreSQL database from within Typescript

At this stage of the project, I'm not making use of these resources, however I configured them now, as I will likely need to to use them later

#### Client

I created a new Next.js project, installing a few libraries that I've found useful before:

* Chakra UI: A UI framework that closely follows React principles
* SWR: A reactive request handler that allows for simple data fetching and mutation

I also installed `socket-io.client`, a frontend library that allows me to create connections to my websocket server. With reference to _some_ of the elements of [an excellent tutorial by Holger Schmitz](https://developer.okta.com/blog/2021/07/14/socket-io-react-tutorial#implement-the-socketio-client-using-react), I was able to connect to my websocket server, and display received messages (see [#evidence](cycle-1.md#evidence "mention")). This code is contained within `index.tsx`

{% tabs %}
{% tab title="index.ts" %}
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
	console.log('Client connected');
	socket.send('Hello world');
	let i = 0;
	setInterval(() => {
		socket.send('message ' + i++);
	}, 1000);
});
```
{% endtab %}

{% tab title="index.tsx" %}
```jsx
import {Heading} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import {io, Socket} from 'socket.io-client';

export default function () {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [messages, setMessages] = useState<string[]>([]);

	useEffect(() => {
		if (!socket) {
			const newSocket = io(`http://localhost:8888`);
			setSocket(newSocket);
			return;
		}
		socket.on('message', (message: string) => {
			setMessages(messages => [...messages, message]);
		});
	}, [socket, setSocket, setMessages]);

	return (
		<>
			<Heading>Hello world!</Heading>
			<p>Socket messages:</p>
			<ul>
				{messages.map(message => (
					<li key={message}>{message}</li>
				))}
			</ul>
		</>
	);
}
```
{% endtab %}
{% endtabs %}

### Challenges

The initial setup went fairly smoothly overall, with some minor configuration tweaks required in order to get my `shared` package properly imported and configured.

The only other significant issue I encountered was forgetting to correctly configure [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), a security mechanism that is designed to ensure that the server only processes requests from recognised domains. This resulted in my client being unable to connect to my server, and an error being logged to the browser console. Fortunately, I was familiar with CORS issues (however, not with websockets), and I quickly resolved the issue by passing a configuration object to my websocket server object:

```typescript
{
	cors: {
		origin: env.CLIENT_ORIGIN,
		methods: ['GET', 'POST'],
	},
}
```

## Testing

Evidence for testing

### Tests

| Test | Instructions                                  | What I expect                                                              | What actually happens | Pass/Fail |
| ---- | --------------------------------------------- | -------------------------------------------------------------------------- | --------------------- | --------- |
| 1    | Visit http://locahost:3000                    | A simple UI is displayed with a list of messages received from the server. | As expected           | Pass      |
| 2    | Visit localhost:3000, and observe server logs | A "Client connected message" is logged to the console.                     | As expected           | Pass      |

### Evidence

![](<../.gitbook/assets/image (1).png>)![](<../.gitbook/assets/image (5).png>)
