# 2.2.5 Cycle 5: Housekeeping

## Design

### Objectives

In this cycle, I will aim to "tidy-up" the codebase, adding some features that will be primarily useful as development but also some minor logic that enables game rejoining. I will also make sure to move the majority of the logic currently contained in the main `index.ts` file in the server into the game and player classes. I'll also change some global styles on the client-side, so when I add a button or header, it is consistent throughout the app.

* [x] Refactor server-side socket messaging into separate files and into classes where appropriate.
* [x] Fix the issues with duplicate triggering of socket listeners on the client in `SocketHandler.tsx`
* [x] Change styling to fit the styles decided in [#design-language](../1-analysis/1.4a-features-of-the-proposed-solution.md#design-language "mention"), and ensure these are consistent throughout the app
* [x] Create rejoin logic that will automatically rejoin a game if a user loses and then regains a network connection

### Usability Features

* It should be clear the relevancy of notifications - for instance, if the message is just information, and not a warning, this should be immediately obvious to the user.
* Add a _temporary_ "Leave Game" button for testing in development. This will be moved to the settings popup in a future cycle.
* The styling should prioritise legibility and good contrast ratios (W3, 2019), before aesthetics

### Key Variables

| Variable Name | Use                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| notifications | Stores a list of all currently active notifications as an object with details such as id, message, type, etc.                       |
| game          | Stores the current game - this may have to be stored persistently to be maintained when losing connection or on accidental refresh. |

### Pseudocode

<pre><code>// Reconnection
// Reconnection: Client
subroutine onload
<strong>    game = fetch 'game' from browser storage
</strong>    if game
        display reconnect button
            make new socket connection using game.code
        display leave game button
            remove 'game' from local storage
            disconnect socket
    end if
end subroutine


// Reconnection: Server
subroutine on_reconnection (player_id, game_code)
    game = get game from game_code
    playerInGame = find player_id in game.players
    if (playerInGame)
        playerInGame.socket = socket
        socket.player = playerInGame 
        broadcast reconnection to all other players
    end if
end subroutine

subroutine on_player_disconnect (id)
    player = find player in players list from id
    notify all other players player.name has disconnected
end subroutine</code></pre>

## Development

### Outcome

#### Server

Very little additional logic was added in this cycle, however, I moved a significant amount of socket message broadcasting into the player class. For instance, if I wanted to broadcast a players location, instead of crafting a emit function each time, I can instead do:

```typescript
player.emitLocation()
```

There are several other examples like this, but despite adding minimal immediate value to the user, they will speed up code readability and development time, which in turn will increase the speed at which new features can be developed.

To implement reconnection logic, I simply had to reassign some variables, and add a few if-else statements (see below), as I had previously intended to implement this, so very little needed to be added to make it functional.

#### Client

A lot of styling changes occurred in this cycle - changing lots of colours to better fit with the light theme decided in [#design-language](../1-analysis/1.4a-features-of-the-proposed-solution.md#design-language "mention"). I also imported the "Share Tech Mono" font, and ensured it was used throughout the app, as well as removing border radius on buttons to create a sharp, futuristic aesthetic.

I also moved the socket event listeners outside of the effect hook, so they can be removed and re-added when the component re-renders, preventing duplicate triggering. As for the rejoin logic, this involved converting the global state to persist in browser storage (a one-liner with the library I was using), before adding some buttons that would appear if a game was detected, but no socket connection. The rest of the connection logic was the same.



{% tabs %}
{% tab title="game.ts" %}
```typescript
export class Game {
  id: string;
  creationTime: number;
  startTime?: number;
  players: Player[];
  hunter: Player[];
  hunted: Player[];
  host?: Player;
  hasStarted: boolean;
  joinCode: string;
  options: GameOptions; 

  // SHORTENED FOR BREVITY
  
  // Sends game data to the player with this id.
  sendGameData(id: string) {
    const primaryPlayer = this.players.find(p => p.id === id)!;
    const socket = primaryPlayer.socket;
    
    // Send basic game information
    socket.emit('game-init', {
      id: socket.game.id,
      code: socket.game.joinCode,
      options: socket.game.options,
      hasStarted: socket.game.hasStarted,
    });

    // Sends data about the new player to all other players
    socket
      .to(socket.game.id)
      .emit(
      // If the player joins when game has started, it must be a reconnection, 
      // hence is a different event, for client notification triggering
        `player-${this.hasStarted ? 're' : ''}connected`
        primaryPlayer.getPublic()
      );
    primaryPlayer.emitLocation();
    
    for (const player of this.players) {
      // Don't send data about disconnected players
      if (player.status === 'disconnected') continue;
    
      socket.emit('player-connected', {
        ...player.getPublic(),
        location: player.getCanAccessLocation(id) ? player.location : undefined,
      });
    }
  }
}
```
{% endtab %}

{% tab title="player.ts" %}
<pre class="language-typescript"><code class="lang-typescript">export class Player {
  socket: Socket&#x3C;ClientToServerEvents, ServerToClientEvents>;
  game: Game;
  id: string;
  status: 'disconnected' | 'spectating' | 'alive';
  pref?: 'hunted' | 'hunter';
  type: 'hunted' | 'hunter';
  user: userType;
  isHost: boolean;
  location: GeolocationCoordinates | null;
  isOutside: boolean;
  
  // SHORTENED FOR BREVITY
  // Below is a range of new helper functions that facillitate more readable
  // and easy-to-write code.

  // Returns a boolean: true if both players are hunters, false if not  
  getCanAccessLocation(playerId: string) {
    if (this.type === 'hunted') return false;
    if (this.game.hunter.find(p => p.id === playerId)) return true;
  }

  // Triggers a disconnection event, broadcasting to other players
  disconnect() {
    this.socket.to(this.game.id).emit('player-disconnected', {id: this.id});
    this.status = 'disconnected';
  }

  // Sends player info to all players
  emitInfo() {
    io.to(this.game.id).emit('player-updated', this.getPublic());
  }

  // Sends player location to all applicable players
  emitLocation() {
    if (this.type === 'hunter') {
      io.to(this.game.id + 'hunter').emit('player-location', {
        id: this.id,
        location: this.location,
      });
    }
  }

  // Send all available player data, to appropriate recipients
  emitAll() {
    this.emitInfo();
    this.emitLocation();
  }
<strong>}</strong></code></pre>
{% endtab %}

{% tab title="index.ts" %}
```typescript
// SHORTENED FOR BREVITY LIENES 159-189

// Runs before a socket connection is instantiated (middleware)
io.use((socket, next) => {
  const gameCode = socket.handshake.query['code'] as string;
  const matchingGame = games.find(g => g.joinCode === gameCode);
  if (!matchingGame)
    return next({
      name: 'InvalidGameCode',
      message: 'No game with this game code exists',
    });
  
  if (matchingGame.hasStarted) {
    const playerInGame = matchingGame.players.find(
      p => p.id === socket.user.sub
    );
    if (!playerInGame) {
      return next({
        name: 'GameAlreadyStarted',
        message: 'This game has already started',
      });
    } else {
      // Updates existing player, to "reconnect" it, and assigns 
      // the exisitng player to the socket, and vice versa.
      playerInGame.status = 'alive';
      socket.player = playerInGame;
      playerInGame.socket = socket;
    }
  } else {
    // If the game hasn't started, create a new player in said game
    const player = new Player(socket, matchingGame);
    socket.player = player;
  }

  socket.game = matchingGame;
  next();
});
```
{% endtab %}

{% tab title="SocketHandler.tsx" %}
```typescript
export const SocketHandler = (props: {children: ReactElement | null}) => {
  const [socket, setSocket] = useAtom(socketAtom);
  const [players, setPlayers] = usePlayers();
  const [game, setGame] = useGame();
  const {user} = useAuth0();

  const listeners: Partial<ServerToClientEvents> = {...}

  useEffect(() => {
    if (socket) {
      // Connection events are included here, to differentiate between custom
      // and built-in events.
      socket.on('connect_error', error => {
        toast.error(error.name);
        setPlayers([]);
        socket.disconnect();
        setSocket(null);
      });
      socket.on('disconnect', () => {
        setPlayers([]);
        setSocket(null);
      });
      // Adds all listeners
      Object.entries(listeners).forEach(([name, fn]) => {
        socket.on(name, fn);
      });
    }

    return () => {
      // Removes all listeners when the component unmounts or re-renders.
      // This prevents duplicate firing of events
      if (socket) {
        Object.entries(listeners).forEach(([name, fn]) => {
          socket.off(name, fn);
        });
      }
    };
  // This allows usage of state wuthin the listeners without strange behaviour
  }, [socket, players, game, user]);

  return props.children;
};
```
{% endtab %}

{% tab title="GameContainer.tsx" %}
```typescript
export const GameContainer = () => {
  const [game, setGame] = useGame();
  const socket = useSocket();

  if (!game) return null;
  // If there is no connetion, BUT game data
  if (!socket)
    return (
      <Center h={'100vh'}>
        <ConnectWithCode>
          {connect => (
            <VStack spacing={4}>
              // This is the button that allows reconnection, almost identical
              // to the "Join Game" button created in Cycle 2
              <Button onClick={async () => await connect(game.code)}>
                Reconnect
              </Button>
              // This button resets all game state, and allows the player to
              // join a new game
              <Button
                colorScheme={'red'}
                onClick={() => {
                  setGame(null);
                }}
              >
                Leave Game
              </Button>
            </VStack>
          )}
        </ConnectWithCode>
      </Center>
    )
    
  // Return game page
  return (
    <Flex h={'100vh'} w={'full'} flexDir={'column'}>
      <Flex h={'full'}>
        <Map />
      </Flex>
      <GameFooter />
    </Flex>
  );
};
```
{% endtab %}
{% endtabs %}

### Challenges

* Whilst refactoring, I did encounter some issues with the other players location not being sent to the appropriate clients. This was fixed by doing some [Rubber Duck Debugging](https://en.wikipedia.org/wiki/Rubber\_duck\_debugging), and simply required some deeper thought about the program flow, before being resolved by reworking some if statements.

## Testing

### Tests

| Test | Instructions                                                                | What I expect                         | What actually happens | Pass/Fail |
| ---- | --------------------------------------------------------------------------- | ------------------------------------- | --------------------- | --------- |
| 1    | Load the app, and create a new game                                         | A new font and more readable colours. | As expected           | Pass      |
| 2    | Create a game, have two players join it, and have one refresh their browser |                                       |                       |           |

### Evidence

![](<../.gitbook/assets/localhost\_3000\_(iPhone 12 Pro) (7).png>)![](<../.gitbook/assets/localhost\_3000\_(iPhone 12 Pro) (9).png>)![](<../.gitbook/assets/localhost\_3000\_(iPhone 12 Pro) (10).png>)
