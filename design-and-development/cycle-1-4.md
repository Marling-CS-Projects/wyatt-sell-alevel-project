# 2.2.6 Cycle 6: Item generation

## Design

### Objectives

The goal of this cycle will be to create an item system that will randomly generate a range of items with different types and appearances to be rendered on the map. They will need to be randomly generated within the bounds of the defined polygon, and at a constant density for the area. Items will need to be generated in different quantities/probabilities depending on their rarity. Some special items, such as the Phone triangulation kit (see [#power-up-items](../1-analysis/1.4a-features-of-the-proposed-solution.md#power-up-items "mention")), will need some adjustment in their positioning - i.e. not placed right next to the cell towers. I will also add a popup that will appear on click and on proximity to each item, as well as some simple icon-based sprites. I will not implement a player inventory system (picking up and dropping items) in this cycle - I plan to complete this in [cycle-1-5.md](cycle-1-5.md "mention")

* [ ] Randomly generate different items across the map and display them to the client
  * [ ] Handle rarity of items - rarer items should be less likely to be generated
  * [ ] Handle special cases with item generation, as discussed above
* [ ] Show different icon sprites for each item rendered on the client
* [ ] Display a popup above each item with more details on click and on proximity

### Usability Features

* Ensure the item popups are large enough to be legible
  * Clearly display the rarity of the item to make the game more accessible to first time players - it will help them to know when an item is worth picking up
* Use different colours for each item for increased visibility
* (Potential) Add an information button on each popup to give more information about the function of the device. I may not add this here, as I plan to include detailed instructions in the inventory screen once the player picks up the item.

### Key Variables

| Variable Name | Use                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| items         | A list of items stored in the game object that will include various information about the item, including its type, location and rarity. |
| vertices      | A list of co-ordinates for the vertices of the polygon - this will be used to define the bounds of item generation                       |

### Pseudocode

```
subroutine generate_items(vertices)
    items = []
    area = get vertices area in m^2
    itemCount = area / DENSITY_CONSTANT
    
    for x in range(itemCount)
        id = uuid()
        type = generate_random_type()
        
        constraints = get constraints for point
        point = generate_point(vertices, contraints)
        
        details = details[type]
        items.push({id, point, type, details})
    end for
    
    return items
end subroutine
    
subroutine generate_point(vertices, contraints)  
    maxLongitude = max(v.lng for v of vertices)
    minLongitude = min(v.lng for v of vertices)
    maxLatitude = max(v.lat for v of vertices)
    minLatitude = min(v.lat for v of vertices)
    
    randLongitude = rand(minLongitude, maxLongitude)
    randLatitude = rand(minLatitude, maxLatitude)
    
    point = [randLongitude, randLatitude]
    
    if point not in vertices or distance from constraint.point < constraint.distance
        return generate_point(vertices)
    else
        return point
end subroutine


```

## Development

### Outcome

#### Server



#### Client

{% tabs %}
{% tab title="file.tsx" %}
```typescript
```
{% endtab %}
{% endtabs %}

### Challenges

*

## Testing

### Tests

| Test | Instructions | What I expect | What actually happens | Pass/Fail |
| ---- | ------------ | ------------- | --------------------- | --------- |
| 1    |              |               |                       |           |

### Evidence

