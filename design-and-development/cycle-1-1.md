# 2.2.3 Cycle 3: Map and location

## Design

### Objectives

In this cycle, I will aim to create a map with your live updating location on the client. I will also hope to have these updates send to the server, and where appropriate, broadcast them to other notes - for instance, if you're a Hunter, your live location will also update on the screen of other Hunters. Additionally, I would like to include a map in the "Create" screen so that game hosts are able to define a polygon over which the game is playable.

* [x] Create a Google Maps instance on the client, and render the users location and play-area over the top of it
* [x] Stream location updates to the server, and emit them to other clients (where appropriate)
* [x] Render locations of other clients on the client (where appropriate)
* [x] Create a game boundary configuration screen on the "Create" page, and ensure players don't go out of bounds (server-side)

### Usability Features

* The playable game area will have to be made clear to other players to minimise the risk of accidentally breaking the rules
* In some cases, more than one location indicator will appear on a map. There must be a difference in colour between the user and other users indicators to avoid confusion
* Location updates should be smooth, and not sudden jolts. This will be achieved by regular pings and some [linear interpolation](https://en.wikipedia.org/wiki/Linear\_interpolation)
* Location uncertainty should be shown on the map as a translucent circle showing the error range, to avoid confusion if the rendered location is incorrect

### Key Variables

| Variable Name                      | Use                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| location                           | Stores the current user's location                                                                      |
| player?.location (in players list) | Stores the location of other players - this may be null if their location is not available to the user. |

### Pseudocode

```
// Server
subroutine recieve_location_ping (player)
    if (player.hunter)
        broadcast player to all hunter clients
    


// Client
procedure ping_location
    location = get_location()
    if (near out_of_bounds)
        alert("Near boundary")
        if (out_of_bounds
            alert("Move back into play zone")
        end if
    end if
    add_marker_to_map(location, blue)
    socket.send(location)
end procedure

subroutine add_marker_to_map (location, color)
    marker = new Marker({
        x: location.x
        y: location.y
        accuracy: location.accuracy
        color: color
    })
    add marker to map
end subroutine

subroutine recieve_player_location (player)
    update players with new player data (using player.id)
    for i in range(100)
        update marker with {x: (location.x / i), y: (location.y / i)}
    end for
end subroutine
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

I also installed `socket-io.client`, a frontend library that allows me to create connections to my websocket server. With reference to _some_ of the elements of [an excellent tutorial by Holger Schmitz](https://developer.okta.com/blog/2021/07/14/socket-io-react-tutorial#implement-the-socketio-client-using-react), I was able to connect to my websocket server, and display received messages (see [#evidence](cycle-1-1.md#evidence "mention")). This code is contained within `index.tsx`

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

### Tests

| Test | Instructions                                  | What I expect                                                              | What actually happens | Pass/Fail |
| ---- | --------------------------------------------- | -------------------------------------------------------------------------- | --------------------- | --------- |
| 1    | Visit http://locahost:3000                    | A simple UI is displayed with a list of messages received from the server. | As expected           | Pass      |
| 2    | Visit localhost:3000, and observe server logs | A "Client connected message" is logged to the console.                     | As expected           | Pass      |

### Evidence

![](<../.gitbook/assets/image (1) (1).png>)![](<../.gitbook/assets/image (5) (1) (1) (1).png>)
