# 2.2.4 Cycle 4: Map enhancements

## Design

### Objectives

In this cycle, I will aim to add some upgrades to the map interface and overall usability features. The primary feature I will add in the cycle will be the ability to define bounds in the game creation screen and to alert players when they stray outside these bounds. A few other features are more minor - like labels with player details if their location marker is clicked, and a recenter button on the map. I also intend to change the game interface slightly to allow for an information display and settings and inventory buttons.

* [ ] Create a boundary system, where the game host can define and edit the boundary, and players can see (and be warned about) the boundary area
* [ ] Create player labels for hunters to differentiate between each other
* [ ] Add a "recenter" button on the map, that translates the map so that the users location is in the centre again.
* [ ] Add some placeholder buttons for settings and inventory, and some player details at the bottom of the screen

### Usability Features

* The popup text must be large enough for older users to see, and I must be careful to ensure that any added buttons or "hit-boxes" are not too small.
* The boundary system must be clear on the map, and my game must alert the user obviously if they veer too close (vibration and sound)
* Ensure pinch-and-zoom functionality is enabled on the map, for use in a smartphone

### Key Variables

| Variable Name | Use                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| allowedArea   | Stores a list of co-ordinates that define the vertices of the acceptable polygon                                                        |
| players       | Stores a list of all known player data, which will be used to render labels above indicators on the map                                 |
| location      | Stores the current player position which we will check if it is inside bounds on each update, and display warning messages accordingly. |

### Pseudocode

```
// Client
allowedArea = []

subroutine add_point_to_map (point)
    add point to allowedArea
    display point on map
end subroutine

subroutine create_game 
    send /create POST request with content {points: allowedArea}
end subroutine

subroutine on_location_update (location)
    if location near to boundary
        display alert
        vibrate device
end subroutine

procedure recentre
    location = get_my_location()
    set map centre to location
    set zoom level to default
end procedure

// Server
subroutine on_location_update (location)
    if location not in allowedArea
        broadcast player_out_of_bounds to all players
    else if location now back in allowedArea
        broadcast player_back_in_bounds to all players
    else
        update location data
end subroutine
```

### UI Mockup

![](<../.gitbook/assets/image (4).png>)

Add annotation to this!

## Development

### Outcome

#### Server

On the server, the additional code I had to write to allow for player location to be streamed to other clients was minimal due to the strong architecture I had implemented in Cycle 1 and 2. I utilised a new feature in my socket sending process called "rooms". This means that I am able to quickly send a message to multiple clients in a certain group (i.e. all hunters in game with ID: 123) without having to iterate through an array manually.

{% embed url="https://socket.io/docs/v3/rooms/" %}

I also had to update a few class constructors, for instance, ensuring that a player joins and leaves the room for their respective role and game, and making sure that the location is a field on the player class. Additionally, I fixed a few bugs, where player updates would be sent twice or sent to the wrong players.

#### Client

I researched several map libraries to embed a map view in my game. Initially I intended to use the Google Maps API, but after discovering that they charge a high fee (7$ per 1000 map loads). After doing some research I found [react-leaflet](https://react-leaflet.js.org/), that allowed for easy integration into a React app, and supported several different mapping providers.

I had to do some calculations to correctly render the player location depending on the zoom level of the map. I also had to make sure that the clients location was updated regularly on the map, and on the server, and that the updates were smooth.

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
// Imports animation styling
import './map-lerp.css';

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

  // This updates the location of the marker if the parameters passed 
  // to this component are changed.
  useEffect(() => {
    if (props.location && circleRef.current) {
      circleRef.current.setLatLng([
        props.location.latitude,
        props.location.longitude,
      ]);
    }
  }, [circleRef, props.location]);
  
  // This is the actual circle marker. At present it only displays a
  // different color for other players, but I intend to add popups 
  // in the future.
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
        Example popup
      </Popup>
    </CircleMarker>
  );
};

// This is a reusable function that broadcasts the given location data to
// the server
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

{% tab title="map-lerp.css" %}
```css
/* Source: https://gist.github.com/meule/777d9a8a42e2c99a3386 */
/* This adds a linear transition to the map marker when their */
/* location updates */
.leaflet-marker-pane > * {
    -webkit-transition: transform .3s linear;
    -moz-transition: transform .3s linear;
    -o-transition: transform .3s linear;
    -ms-transition: transform .3s linear;
    transition: transform .3s linear;
}
```
{% endtab %}

{% tab title="SocketHandler.tsx" %}
```typescript
// I added a small section to <SocketHandler/> to recieve location updates
// and update the player list accordingly.
socket.on('player-location', message => {
  setPlayers(players =>
    players.map(p =>
      p.id === message.id ? {...p, location: message.location} : p
    )
  );
})
```
{% endtab %}

{% tab title="index.ts" %}
```jsx
// SHORTENED FOR BREVITY (LINES 178-239)
// This is a function to transmit connection and disconnection events
io.on('connection', async socket => {
  io.emit('game-init', {
    id: socket.game.id,
    code: socket.game.joinCode,
    options: socket.game.options,
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
      // Here we append the location to the `player-connected` broadcast
      // IF the both the player being send and recieving is a hunter 
      location:
        socket.player.type === 'hunter' && socket.player.type === type
          ? player.location
          : undefined,
    });
  }

  socket.on('disconnect', () => {
    io.emit('player-disconnected', {id: socket.user.sub});
  });

  socket.on('player-pref', async data => {
    const type = socket.player.updatePref(data);
    io.emit('player-updated', {
      id: socket.player.id,
      type,
    });
    // We make sure to send a location update to all hunter clients, if
    // a player changes to become a hunter, to ensure they are all in sync.
    if (socket.player.type === 'hunter') {
      io.to(socket.game.id + 'hunter').emit('player-location', {
        id: socket.player.id,
        location: socket.player.location,
      });
    }
  });

  // We register a seperate event (`player-location`), for broadcasting
  // location updates to the hunter "room", if the player is a hunter
  socket.on('player-location', async data => {
    socket.player.location = data;
    if (socket.player.type === 'hunter') {
      io.to(socket.game.id + 'hunter').emit('player-location', {
        id: socket.player.id,
        location: data,
      });
    }
  });
});
```
{% endtab %}
{% endtabs %}

### Challenges

* Working out how to display the accuracy circle correctly was challenge, but it helped to break down the problem into smaller parts (see: [#thinking-abstractly-and-visualisation](../1-analysis/1.4b-computational-methods.md#thinking-abstractly-and-visualisation "mention")), until I came to the solution - I had to listen for map updates, find the map width and finally calculate proportions.
* I was initially confused about how to update the marker position - typically within React, if you update the parameters passed to a component, it will update automatically. However, it appeared this was not the case with `react-leaflet`, as I had to use "refs" in order to interact with the marker. This was discovered by reading the example code provided in the library's documentation.

## Testing

### Tests

| Test | Instructions                                                          | What I expect                                                                                                              | What actually happens | Pass/Fail |
| ---- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------- |
| 1    | A player creates and starts a game with no other players              | A map is displayed with their location indicator in the centre, and no other indicators rendered                           | As expected           | Pass      |
| 2    | A Hunter and Hunted player join the same game, and the host starts it | Each player should see a map with only their own location marker rendered                                                  | As expected           | Pass      |
| 3    | 2 Hunted players join the same game, and the host starts it           | Each player should see a map with only their own location marker rendered                                                  | As expected           | Pass      |
| 4    | 2 Hunter players join the same game, and the host starts it           | Both players should see a map with their own location in the centre in blue, AND the other players location marker in red. | As expected           |           |
| 5    | Create and start a game                                               | The map renders a satellite view, and supports zoom with a dynamic accuracy circle                                         | As expected           |           |

### Evidence

TODO: RECORD EVIDENCE
