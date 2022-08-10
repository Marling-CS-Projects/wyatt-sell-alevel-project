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





{% tabs %}
{% tab title="index.ts" %}
```typescript
```
{% endtab %}
{% endtabs %}

### Challenges

*

## Testing

### Tests

| Test | Instructions                                             | What I expect                                                                                    | What actually happens | Pass/Fail |
| ---- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------- | --------- |
| 1    | A player creates and starts a game with no other players | A map is displayed with their location indicator in the centre, and no other indicators rendered | As expected           | Pass      |

### Evidence

TODO: RECORD EVIDENCE
