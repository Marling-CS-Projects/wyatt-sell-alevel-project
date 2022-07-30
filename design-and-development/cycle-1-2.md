# 2.2.4 Cycle 4: Map enhancements

## Design

### Objectives

In this cycle, I will aim to add some upgrades to the map interface and overall usability features. The primary feature I will add in the cycle will be the ability to define bounds in the game creation screen and to alert players when they stray outside these bounds. A few other features are more minor - like labels with player details if their location marker is clicked, and a recenter button on the map. I also intend to change the game interface slightly to allow for an information display and settings and inventory buttons.

* [x] Create a boundary system, where the game host can define and edit the boundary, and players can see (and be warned about) the boundary area
* [x] Create player labels for hunters to differentiate between each other
* [x] Add a "recenter" button on the map, that translates the map so that the users location is in the centre again.
* [x] Add some placeholder buttons for settings and inventory, and some player details at the bottom of the screen

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

![](../.gitbook/assets/image.png)

## Development

### Outcome

#### Server

Most of the changes required were entirely client side and required very little modification to the server codebase. I added some logic to send "Player out of bounds" messages to other clients when a player location update was not within the previously defined bounds. I also ensured that the `Game` object now included an array of vertices which defined the bounds for that specific game, as well as changing the `/create` request handling to support an array of vertices.

Lastly, I optimised a few processes - for instance, I ensured that if a client sent a location update, it did not get broadcast back to the same client, and I moved the location broadcasting subroutine into the player object, for simpler usage.

#### Client

I added a library (`react-leaflet-draw`) that enabled polygon drawing on the map and recorded the relevant co-ordinate of each vertex. I then created an [even-odd rule algorithm](https://en.wikipedia.org/wiki/Even%E2%80%93odd\_rule) to detect whether the users location was within the game bounds (this function was placed in the `shared` directory, for easy usage in the server too).

{% embed url="https://www.baeldung.com/cs/geofencing-point-inside-polygon" %}
I followed this guide to create my algorithm
{% endembed %}

I used similar principles to write a separate algorithm for detecting proximity to edge by computing the perpendicular intersections distance with each line segment and finding the minimum. I also implemented the visual changes, namely the information panel and buttons at the bottom of the screen, the player information popups on each node and the recenter button. This required some minor refactoring to implement, but was fairly straightforward. I made some small visual tweaks too, changing from a dark to a light theme, for increased readability (especially important for my target audience:[#older-gamers](../1-analysis/1.2-stakeholders.md#older-gamers "mention"))

{% tabs %}
{% tab title="utils.ts" %}
```typescript
export const isPointInsidePolygon = (
  pointRaw: {lat: number; lng: number},
  polygonRaw: {lat: number; lng: number}[]
) => {
  // Initiates a mutable boolean to store the "inside" state
  let inside = false;
  const polygon = polygonRaw.map(p => ({x: p.lat, y: p.lng}));
  // The point we are testing
  const point = {x: pointRaw.lat, y: pointRaw.lng};
  // Iterates over each point on the polygon, assigning i to be the 
  // "current point" and j to be the point before.
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    // Assigns (xi, yi) and (xj, yj) to be co-ordinates for the pair of
    // points on the polygon.
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      // The first condition checks whether point.y is between yi and yj
      (yi > point.y) !== (yj > point.y) &&
      // AND ensures that point.x is greater than the s_x of the line segment
      // (the x co-ordinate of the line if you extended it to point.y)
      point.x > ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      
    // If there is an intersection, invert the current "inside" value - if
    // there are an even number of intersections, the point does not lie 
    // within the polygon.
    if (intersect) inside = !inside;
  }
  return inside;
};

export const distanceFromBoundary = (
  pointRaw: {lat: number; lng: number},
  polygonRaw: {lat: number; lng: number}[]
) => {
  const polygon = polygonRaw.map(p => ({x: p.lat, y: p.lng}));
  const point = {x: pointRaw.lat, y: pointRaw.lng};

  let distances = [];
  // As above iterates over pairs of polygon points to get points for a
  // segment (xi, yi), (xj, yj)
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Finds the gradient and inverse gradient of the line segment
    const gradient = (yj - yi) / (xj - xi);
    const inverseGradient = -1 / gradient;
    
    // Uses y = mx + c (rearranged), to find the point at which the
    // line that intersects the point and is perpendicular to the segment
    // intersects the segment
    const xIntersect =
      (yj - gradient * xj - (point.y - inverseGradient * point.x)) /
      (inverseGradient - gradient);
      
    // Find the y co-ordinate on the segment by using y = mx + c and
    // substituting in the new x point.
    const yIntersect = gradient * xIntersect + yj - gradient * xj;
    
    // Uses a measure function I found that takes into account the
    // Earths curvature to compute a distance in metres
    const distance = measure(point.x, point.y, xIntersect, yIntersect);
    distances.push(distance);
  }
  // Returns the minimum of all the distances from each segment
  return Math.min(...distances);
};
```
{% endtab %}

{% tab title="MapPolygon.tsx" %}
```tsx
import {FeatureGroup} from 'react-leaflet';
import {EditControl} from 'react-leaflet-draw';
import {DrawEvents, LatLng} from 'leaflet';
import {Dispatch, SetStateAction} from 'react';
import {GameOptions} from '@monorepo/shared';

type UpdateParameter =
  | DrawEvents.Edited
  | DrawEvents.Created
  | DrawEvents.Deleted;

// This would be added as a child element of <Map/> in the create screen,
// with options and setOptions passed down to it.
export default (props: {
  options: GameOptions;
  setOptions: Dispatch<SetStateAction<GameOptions>>;
}) => {
  // A helper function to add the vertices to the game options
  const setVertices = (vertices: GameOptions['vertices']) => {
    props.setOptions({
      ...props.options,
      vertices,
    });
  };

  // This function runs on create, edit and delete of polygons to ensure 
  // the stored vertex array is in sync with what the user sees.
  const update = (v: UpdateParameter) => {
    switch (v.type) {
      case 'draw:deleted':
        setVertices([]);
        break;
      case 'draw:created':
        // The data passed to the "update" function has a different structure
        // depending on what event occurs, meaning some detective work was
        // required to find the appropriate data. 
        setVertices(
          (v.layer.editing.latlngs[0][0] as LatLng[]).map(({lat, lng}) => ({
            lat,
            lng,
          }))
        );
        break;
      case 'draw:edited':
        const latlngArr = (
          ((v as DrawEvents.Edited).layers.getLayers()[0] as any)!.editing
            .latlngs[0][0] as LatLng[]
        ).map(({lat, lng}) => ({lat, lng}));
        setVertices(latlngArr);
    }
  };

  return (
    <FeatureGroup>
      <EditControl
        position="topright"
        // Registers the update subroutine to various event listeners
        onEdited={update}
        onCreated={update}
        onDeleted={update}
        // Disables all other editing controls apart from the polygon
        draw={{
          rectangle: false,
          circle: false,
          marker: false,
          polyline: false,
          circlemarker: false,
        }}
      />
      // Renders a custom stylesheet to disable drawing multiple polygons
      // This applys a "display: none" style to the relevant button.
      {props.options.vertices.length && (
        <link rel="stylesheet" type="text/css" href={'control-hide.css'} />
      )}
    </FeatureGroup>
  );
};

```
{% endtab %}

{% tab title="player.ts" %}
```typescript
 // SHORTED FOR BREVITY: LINES 61-87 
  updateLocation(location: GeolocationCoordinates) {
    this.location = location;
    // Emits player location to all other hunters if player is a hunter
    if (this.socket.player.type === 'hunter') {
      this.socket.to(this.game.id + 'hunter').emit('player-location', {
        id: this.id,
        location: this.location,
      });
    }
    // Determines whether player is inside game area
    const isInside = isPointInsidePolygon(
      {lat: this.location.latitude, lng: this.location.longitude},
      this.game.options.vertices
    );
    // If player was outside before and is now inside, broadcast that they
    // are BACK inside.
    if (this.isOutside && isInside) {
      this.isOutside = false;
      this.socket.to(this.game.id).emit('player-boundary', {
        id: this.id,
        outside: false,
      });
    }
    // If they weren't outside before but now are, broadcast that they are
    // now outside.
    if (!this.isOutside && !isInside) {
      this.isOutside = true;
      this.socket.to(this.game.id).emit('player-boundary', {
        id: this.id,
        outside: true,
      });
    }
  }
```
{% endtab %}

{% tab title="Map.tsx" %}
```jsx
import {ReactNode, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import {
  distanceFromBoundary,
  GameOptions,
  isPointInsidePolygon,
} from '@monorepo/shared/src/index';
import {toast} from 'react-hot-toast';
import {useGame, useLocation} from '../../../utils/hooks';
// Only import MapWrapper in the browser, as leaflet does not function
// with sever-side rendering
const MapWrapper = dynamic(() => import('./MapInner'), {ssr: false});

export const Map = (props: {
  children?: ReactNode;
  vertices?: GameOptions['vertices'];
}) => {
  const [location] = useLocation();
  const [game] = useGame();
  // Stores an array of alerts, so they can be removed when expired.
  const [warningIds, setWarningIds] = useState<string[]>([]);

  const vertices = game?.options.vertices || props.vertices;

  useEffect(() => {
    if (location && vertices?.length) {
      // Finds whether player is inside, and how far they are from boundary
      // on every location update.
      const isInside = isPointInsidePolygon(
        {lat: location.latitude, lng: location.longitude},
        vertices
      );
      const distance = distanceFromBoundary(
        {lat: location.latitude, lng: location.longitude},
        vertices
      );
      
      // Remove all previous warnings
      if (warningIds.length) {
        warningIds.forEach(id => toast.dismiss(id));
      }
      
      if (!isInside) {
        // Display an persistent alert if the player is outside.
        const toastId = toast.error('You are not inside the game area.', {
          duration: Infinity,
        });
        setWarningIds(prev => [...prev, toastId]);
      } else {
        // If the players distance from the border is less than the
        // inaccuracy of the user's location, display a persistent alert
        // and vibrate the users phone for 100ms.
        if (distance <= location.accuracy / 2) {
          const toastId = toast.error(
            'You are near the edge of the game area.',
            {duration: Infinity}
          );
          navigator.vibrate(100);
          setWarningIds(prev => [...prev, toastId]);
        }
      }
    }
  }, [location, vertices]);
  
  // Display the map and pass any <Map/> children down
  return <MapWrapper>{props.children}</MapWrapper>;
};
```
{% endtab %}

{% tab title="GameContainer.tsx" %}
```tsx
import {Button, Flex, HStack, Text, VStack} from '@chakra-ui/react';
import {Map} from './map/Map';
import {useGame, useMe} from '../../utils/hooks';
import {ReactNode, useEffect, useState} from 'react';
import {TypeTag} from '../TypeTag';

export const GameContainer = () => {
  const [game] = useGame();

  // Only display the game container if there is an ongoing game.
  if (!game) return null;

  return (
    <Flex h={'100vh'} w={'full'} flexDir={'column'}>
      <Flex h={'full'}>
        <Map />
      </Flex>
      <GameFooter />
    </Flex>
  );
};

const GameFooter = () => {
  const me = useMe();
  const [game] = useGame();
  if (!me || !game) return null;

  return (
    // Creates a footer that displays the information and buttons
    <Flex p={4}>
      <HStack justifyContent={'space-between'} w={'full'}>
        <VStack flexDir={'column'} spacing={2} alignItems={'flex-start'}>
          <HStack spacing={2} alignItems={'center'}>
            <Text fontSize={24} fontWeight={'800'} lineHeight={'24px'}>
              {me.username.toUpperCase()}
            </Text>
            <GameTime />
          </HStack>
          <TypeTag type={me.type} />
        </VStack>
        <HStack h={'full'} justifyContent={'flex-end'}>
          <FooterButton>🎒</FooterButton>
          <FooterButton>⚙️</FooterButton>
        </HStack>
      </HStack>
    </Flex>
  );
};

const GameTime = () => {
  const [game] = useGame();
  const [time, setTime] = useState(0);

  // A function that updates the "time" state every second, relative to the
  // unix game start time.
  useEffect(() => {
    const inverval = setInterval(() => {
      if (game?.startTime) {
        setTime(Math.floor((Date.now() - game.startTime) / 1000));
      }
    });
    return () => clearInterval(inverval);
  }, [game]);

  if (!game) return null;

  return (
    <Text>
      // Display the minutes and seconds the game has been going, padded
      // zeros
      {Math.floor(time / 60)
        .toString()
        .padStart(2, '0')}
      :{(time % 60).toString().padStart(2, '0')}
    </Text>
  );
};

// Reusable FooterButton component
const FooterButton = (props: {children: ReactNode}) => {
  return (
    <Button
      h={'full'}
      fontSize={40}
      borderColor={'red'}
      borderWidth={2}
      borderRadius={'lg'}
      style={{
        aspectRatio: '1',
      }}
    >
      {props.children}
    </Button>
  );
};
```
{% endtab %}
{% endtabs %}

### Challenges

Overall this was a fairly simple Cycle, with largely cosmetic changes

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
