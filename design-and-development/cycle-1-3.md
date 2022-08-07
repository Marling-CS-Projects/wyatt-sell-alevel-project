# 2.2.5 Cycle 5: Housekeeping

## Design

### Objectives

In this cycle, I will aim to "tidy-up" the codebase, adding some features that will be primarily useful as development but also some minor logic that enables game rejoining. Throughout my refactoring of the codebase, I will attempt to make a system that is flexible enough to allow for me to add new features and routes in the future. I do however plan to build a global notification system that can be used easily, as I encountered some buggy behaviour in the previous cycle with showing and hiding alerts.

* [ ] Create a notification system that stores messages in a global queue and allows adding, removing and clearing
* [ ] Refactor server-side socket messaging into separate files and into classes where appropriate.
* [ ] Change styling to fit the styles decided in [#design-language](../1-analysis/1.4a-features-of-the-proposed-solution.md#design-language "mention"), and ensure these are consistent throughout the app
* [ ] Create rejoin logic that will automatically rejoin a game if a user loses and then regains a network connection

### Usability Features

* It should be clear the relevancy of notifications - for instance, if the message is just information, and not a warning, this should be immediately obvious to the user.
* Add a _temporary_ "Leave Game" button for testing in development. This will be moved to the settings popup in a future cycle.
* The styling should prioritise legibility and good contrast ratios (W3, 2019), before aesthetics

### Key Variables

| Variable Name | Use                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| notifications | Stores a list of all currently active notifications as an object with details such as id, message, type, etc. |
| game          | Stores the location of other players - this may be null if their location is not available to the user.       |

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
