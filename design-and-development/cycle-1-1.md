# 2.2.3 Cycle 3: Map and location

## Design

### Objectives

In this cycle, I will aim to create a map with your live updating location on the client. I will also hope to have these updates send to the server, and where appropriate, broadcast them to other notes - for instance, if you're a Hunter, your live location will also update on the screen of other Hunters. Additionally, I would like to include a map in the "Create" screen so that game hosts are able to define a polygon over which the game is playable.

* [x] Create a Google Maps instance on the client, and render the users location and play-area over the top of it
* [x] Stream location updates to the server, and emit them to other clients (where appropriate)
* [x] Render locations of other clients on the client (where appropriate)

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
    update server player with new player data (using player.id)
    if (player.hunter)
        broadcast player to all hunter clients
    end if
end subroutine

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

On the server, the additional code I had to write to allow for player location to be streamed to other clients was minimal due to the strong architecture I had implemented in Cycle 1 and 2. I utilised a new feature in my socket sending process called "rooms". This means that I am able to quickly send a message to multiple clients in a certain group (i.e. all hunters in game with ID: 123) without having to iterate through an array manually.

{% embed url="https://socket.io/docs/v3/rooms/" %}

I also had to update a few class constructors, for instance, ensuring that a player joins and leaves the room for their respective role and game, and making sure that the location is a field on the player class. Additionally, I fixed a few bugs, where player updates would be sent twice or sent to the wrong players.

#### Client

I researched several map libraries to embed a map view in my game. Initially I intended to use the Google Maps API, but after discovering that they charge a high fee (7$ per 1000 map loads). After doing some research I found [react-leaflet](https://react-leaflet.js.org/), that allowed for easy integration into a React app, and supported several different mapping providers.

I had to do some calculations to correctly render the player location depending on the zoom level of the map. I also had to make sure that the clients location was updated regularly on the map, and on the server.

{% tabs %}
{% tab title="Map.tsx" %}
```typescript
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  CircleMarker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {useEffect, useRef, useState} from 'react';
import {CircleMarker as LeafletCircleMarker, LatLng} from 'leaflet';
import {useMe, usePlayers, useSocket} from '../../utils/hooks';
import {Socket} from 'socket.io-client';

export default () => {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const socket = useSocket();

  useEffect(() => {
    // This is a built in browser function that is called when a 
    // device's location updates
    const watchId = navigator.geolocation.watchPosition(data => {
      console.log('watch called');
      setLocation(data.coords);
      if (socket) {
        emitLocation(socket, data.coords);
      }
    });
    
    // This is a function which requests a new location each second. 
    // In combination with the above function, this will ensure that
    // player location is both accurate and up-to-date.
    const interval = setInterval(() => {
      console.log('interval called', socket);
      navigator.geolocation.getCurrentPosition(data => {
        setLocation(data.coords);
        if (socket) {
          emitLocation(socket, data.coords);
        }
      });
    }, 1000);
    
    // Clear interval when component unmounts. This prevents memory leaks.
    return () => {
      console.log('cleared');
      clearInterval(interval);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [socket]);

  if (!location || !socket) return null;
  
  // Render the map, centering it at the the players location.
  // The <TileLayer/> component is responsible for renddering the actual map 
  // content. If we know the domain from which Google requests their map
  // tiles, we can use this for no extra cost in our map, which is what
  // you see here.
  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={13}
      scrollWheelZoom={false}
      style={{height: '100vh', width: '100%'}}
    >
      <TileLayer
        url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
      />
      <MapMarkers location={location} />
    </MapContainer>
  );
};

// Component that renders map markers of other players
const MapMarkers = (props: {location: GeolocationCoordinates}) => {
  const [players] = usePlayers();
  const me = useMe();

  if (!me) return null;

  return (
    <>
      <PlayerMarker location={props.location} isMe />
      {players
        .filter(p => p.location && p.id !== me.id)
        .map(({location}) => (
          <PlayerMarker location={location!} isMe={false} />
        ))}
    </>
  );
};

// Component that renders each individual map markers
const PlayerMarker = (props: {
  location: GeolocationCoordinates;
  isMe: boolean;
}) => {
  // "refs" allow us to interact with the underlying HTML element within
  // React.
  const circleRef = useRef<LeafletCircleMarker<any>>(null);
  const map = useMap();

  const mapZoomListener = () => {
    const bounds = map.getBounds();
    const pixelBounds = map.getSize();
    const {lat} = bounds.getCenter();
    
    // The code below is used to update the accuracy circle of the player
    // depending on zoom value. Every time we fetch a location on the client
    // an "accuracy" value is associated with it. In common map apps, this is
    // rendered as a translucent circle around the actual location.
    
    // In this case, we have to convert the metre value of the accuracy to
    // pixel values that we can show on our map. We find what percentage of the 
    // map width is covered by the accuracy distance, and we convert that to 
    // find its radius in pixels, before updating our location indicator.
    
    const widthInMetres = new LatLng(lat, bounds.getWest()).distanceTo({
      lat,
      lng: bounds.getEast(),
    });
    if (circleRef.current) {
      circleRef.current.setStyle({
        weight: (props.location.accuracy / widthInMetres) * pixelBounds.x,
      });
    }
  };

  // This registers and unregisters the afformentioned zoom listeners
  useEffect(() => {
    map.on('load', mapZoomListener);
    map.on('zoom', mapZoomListener);
    return () => {
      map.off('load', mapZoomListener);
      map.off('zoom', mapZoomListener);
    };
  }, [circleRef, map]);

  // This updates the location of the marker if the 
  // parameters passed to this component are changed
  useEffect(() => {
    if (props.location && circleRef.current) {
      circleRef.current.setLatLng([
        props.location.latitude,
        props.location.longitude,
      ]);
    }
  }, [circleRef, props.location]);

  return (
    <CircleMarker
      center={[props.location.latitude, props.location.longitude]}
      color={props.isMe ? '#4286f5' : 'red'}
      stroke
      fillColor={props.isMe ? '#4286f5' : 'red'}
      opacity={0.2}
      fillOpacity={1}
      radius={10}
      ref={circleRef}
    >
      <Popup>
        A pretty CSS3 popup. <br /> Easily customizable.
      </Popup>
    </CircleMarker>
  );
};

const emitLocation = (socket: Socket, data: GeolocationCoordinates) => {
  socket.emit('player-location', {
    accuracy: data.accuracy,
    altitude: data.altitude,
    altitudeAccuracy: data.altitudeAccuracy,
    heading: data.heading,
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed,
  });
};

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
