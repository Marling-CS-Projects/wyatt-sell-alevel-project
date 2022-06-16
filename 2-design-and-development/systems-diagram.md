# 2.1 Design Frame

## Systems Diagram

![](../.gitbook/assets/image.png)

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

The speed and accuracy to which a user can complete the goal. To do this, I will create a menu system which is easy to navigate through in order for to find what you are looking for. The information which is more important can be found with less clicks.

#### Aims

* Create a menu system that is quick and easy to navigate through
* Create a controls system that isn't too complicated but allows the player to do multiple actions

### Engaging

In order to make my game engaging, there must a variety of different mechanics that interact in various ways. There must also be enough features for the game to be fun to play again and again. This will primarily be aided by the real-life multiplayer capabilities as well as the large amount of control the player has over the game - they can travel wherever they want in real life, and this will be reflected in-game.

#### Aims

* Create a variety of items and mini-games with different functions and/or interfaces
*
* Incorporate a style of game art the suits the game

### Error Tolerant

The solution should have as few errors as possible and if one does occur, it should be able to correct itself. To do this, I will write my code to manage as many different game scenarios as possible so that it will not crash when someone is playing it.

#### Aims

* The game doesn't crash
* The game does not contain any bugs that damage the user experience

### Easy To Learn

The solution should be easy to use and not be over complicated. To do this, I will create simple controls for the game. I will make sure that no more controls are added than are needed in order to keep them as simple as possible for the players.

#### Aims

* Create a list of controls for the game
* Create an in-level guide that helps players learn how to play the game

## Pseudocode for the Game

### Pseudocode for game

This is the basic layout of the object to store the details of the game. This will be what is rendered as it will inherit all important code for the scenes.

```
object Game
    type: Phaser
    parent: id of HTML element
    width: width
    height: height
    physics: set up for physics
    scenes: add all menus, levels and other scenes
end object

render Game to HTML web page
```

### Pseudocode for a level

This shows the basic layout of code for a Phaser scene. It shows where each task will be executed.

```
class Level extends Phaser Scene

    procedure preload
        load all sprites and music
    end procedure
    
    procedure create
        start music
        draw background
        create players
        create platforms
        create puzzle elements
        create enemies
        create obstacles
        create finishing position
        create key bindings
    end procedure
    
    procedure update
        handle key presses
        move player
        move interactable objects
        update animations
        check if player at exit
    end procedure
    
end class
```
