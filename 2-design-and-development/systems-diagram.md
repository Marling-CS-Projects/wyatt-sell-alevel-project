# 2.1 Design Frame

## Systems Diagram

![](<../.gitbook/assets/image (4) (1).png>)

This diagram shows the different parts of the game that I will focus on creating. I have split each section into smaller sub-sections. Throughout the development stage, I will pick one or two of these sections to focus on at a time to gradually build up and piece together the game. I have broken the project down this way as it roughly corresponds to the success criteria.

## Usability Features

Usability is an important aspect to my game as I want it to be accessible to all. There are 5 key points of usability to create the best user experience that I will be focusing on when developing my project. These are:

### Effective

For my game to be effective, goals must be **achievable and understandable**. Items on the map should be clear and visible. It should be easy to work out what each item does, and how to operate it. Given that a manhunt/hide-and-seek format could last for a variable amount of time, my game will optionally allow for a shrinking boundary area. It should also be easy to capture a player when you are in a very close proximity. The buttons and alerts should also be large and simple, in order to make the game more accessible and playable for my [1.2-stakeholders.md](../1-analysis/1.2-stakeholders.md "mention")

#### Aims

* Allow for a shrinking boundary as game time progresses
* Create bright, colorful item indicators on the map
* Ensure all buttons are large, legible and understandable.

### Efficiency

Efficiency means that the speed and accuracy to which a user can complete the goal must be high.  This will be achieved by having large buttons and simple menus. Alerts should appear immediately and collecting items should be simple and easy. Movement throughout the map should update quickly and smoothly, so players get instant feedback on which direction they are travelling.

#### Aims

* Create a menu system that is quick and easy to navigate through
* Ensure proximity based popups - e.g. when you approach an item, a menu to interact with it should automatically appear
* Use linear interpolation and constant socket connection to ensure smooth location updates

### Engaging

In order to make my game engaging, there must a variety of different mechanics that interact in various ways. There must also be enough features for the game to be fun to play again and again. This will primarily be aided by the real-life multiplayer capabilities as well as the large amount of control the player has over the game - they can travel wherever they want in real life, and this will be reflected in-game.

#### Aims

* Create a variety of items and mini-games with different functions and/or interfaces
* Implement a sci-fi/hacker aesthetic throughout the game
* Ensure the game is playable in a variety of different environments and with differing player counts.

### Error Tolerant

The solution should have as few errors as possible and if one does occur, it should be able to correct itself. To do this, I will write my code to manage as many different game scenarios as possible so that it will not crash when someone is playing it.

#### Aims

* The game doesn't crash
* The game does not contain any bugs that damage the user experience

### Easy To Learn

The solution should be easy to learn, but have enough mechanics to make it fun for experienced players. There needs to be clear and simple guides on the functions of various items, and perhaps a small tutorial at the start of the game.

#### Aims

* Create a guide for each item, accompanied with large clear buttons
* Create a tutorial for players to learn the basics

### Pseudocode for game

This is the basic layout of the object to store the details of the game. This will contain all the data regarding a current game: players, game time, item locations, boundaries, etc.

```
object Game
    id: UUID
    players: Player[]
    hunter: Player[]
    hunted: Player[]
    hasStarted: boolean
    joinCode: string
    options: {
        max: {
            hunter: number
            hunted: number
            total: number
        }
    }
    items: Item[]
    
    function addPlayer
        if players.length == options.max.total
            return false
        add player to players list
        add player to either hunter or hunted list
        return true
    end function
    
    function updatePlayerPref(playerID: UUID, pref: 'hunter' | 'hunted')
        if player not in game players
            error('Player not in game')
        if players.length == options.max.total
            return false
        if [pref].length <= options.max.length
            add player to [pref] list
            return pref
        else
            add player to [inversePref] list
            return inversePref
    end function    
        
end object

use Game object to send data to client over sockets
```

### Pseudocode for players

This is the object that contains information about each individual player. It includes

```
object Player
    socket: Socket
    game: Game
    id: UUID
    status: 'disconnected' | 'spectating' | 'alive'
    pref?: 'hunted' | 'hunter'
    type: 'hunted' | 'hunter'
    user: UserObject
    
    function updatePref(pref: 'hunter' | 'hunted')
        pref = pref
        type = game.updatePlayer(id, pref)
        return type
    end function

end object
```

### Pseudocode for item

This is the object that contains information about each item. It includes

```
object Item
    game: Game
    id: UUID
    location: co-ordinates
    info: object storing data about item, inc. name
    active: boolean
    
    
```
