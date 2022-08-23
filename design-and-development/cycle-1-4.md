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

subroutine generate_random_type()
    // Examples
    types = {
        "a": 6
        "b": 3
        "c": 1
    }
    typesList = []
    
    for type in types 
        for i in types.value
            typesList.push(type.name)
        end for
    end for 
    
    return random item from typesList
end subroutine
```

### UI Mockup

![](<../.gitbook/assets/image (1).png>)

## Development

### Outcome

The items could have been generated on a map simply by creating a bounding box around the polygon, and generating random points recursively, generating a new point if the randomly generated point does not fall within the polygon (using the algorithm created in [cycle-1-2.md](cycle-1-2.md "mention")

<figure><img src="../.gitbook/assets/image.png" alt=""><figcaption><p>This is an example box filled with random points</p></figcaption></figure>

However, whilst developing, I realised there were several unanticipated caveats to this approach. As you can see in the above example, there are regions of overlap and empty space; in other words, it is random but not even. So I want to have randonimity , _but_ even distribution, which sounds impossible! Upon doing some research, I found that several such algorithms exist, with the one I decided to go with being **Poisson Disc Sampling** due to its speed and simplicity.

<figure><img src="../.gitbook/assets/ezgif-5-cccaf9992b.gif" alt=""><figcaption><p>A visualisation of the Poisson-Disc Sampling algorithm</p></figcaption></figure>

To determine the relevant steps to replicate this algorithm in JavaScript, I used this excellent blog post by Mike Bostock, [Visualizing Algorithms](https://bost.ocks.org/mike/algorithms/), as well as a concise paper authored by Robert Bridson, titled [Fast Poisson Disk Sampling in Arbitrary Dimensions](https://www.cs.ubc.ca/\~rbridson/docs/bridson-siggraph07-poissondisk.pdf). The simplified steps are detailed below:

> Step 0
>
> Initialize an n-dimensional background grid for storing samples and accelerating spatial searches. We pick the cell size to be bounded by r/√ n, so that each grid cell will contain at most one sample, and thus the grid can be implemented as a simple n-dimensional array of integers: the default −1 indicates no sample, a non-negative integer gives the index of the sample located in a cell.&#x20;
>
> Step 1
>
> Select the initial sample, x0, randomly chosen uniformly from the domain. Insert it into the background grid, and initialize the “active list” (an array of sample indices) with this index (zero).&#x20;
>
> Step 2
>
> While the active list is not empty, choose a random index from it (say i). Generate up to k points chosen uniformly from the spherical annulus between radius r and 2r around xi. For each point in turn, check if it is within distance r of existing samples (using the background grid to only test nearby samples). If a point is adequately far from existing samples, emit it as the next sample and add it to the active list. If after k attempts no such point is found, instead remove i from the active list.

([Bridson, 2007](../reference-list.md))

<figure><img src="../.gitbook/assets/image (7).png" alt=""><figcaption><p>This is an example box filled with points generated using the Poisson-Disc Sampling Algorithm</p></figcaption></figure>

Using this sampling technique, I created a JavaScript implementation, see below:

{% code overflow="wrap" lineNumbers="true" %}
```typescript
export function poissonDiscSampling(vertices: {lng: number; lat: number}[]) {
  // These define the constants for the program:
  // radius: The minimum distance between two points in metres
  // k: The maximum number of samples to take from a given point
  // cellSize: The size of each cell (can only contain one point)
  const radius = 200;
  const k = 10;
  const cellSize = radius / Math.sqrt(2);

  // This defines the points of the surrounding box 
  const {ranges} = getBoxPoints(vertices);
  const [latMin, latMax] = ranges.lat;
  const [lngMin, lngMax] = ranges.lng;

  const {width, height} = dimensions(vertices);

  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);

  const gridX = (p: {x: number; y: number}) =>
    Math.floor(distance([lngMin, p.y], [p.x, p.y]) / cellSize);
  const gridY = (p: {x: number; y: number}) =>
    Math.floor(distance([p.x, latMin], [p.x, p.y]) / cellSize);
  const gridIndex = (p: {x: number; y: number}) => {
    return gridX(p) + gridWidth * gridY(p);
  };

  const randomPointLngLat = randomPointInsidePolygon(ranges, vertices);
  const randomPoint = {x: randomPointLngLat.lng, y: randomPointLngLat.lat};
  const randomPointIndex = gridIndex(randomPoint);

  const points = {
    [randomPointIndex]: randomPoint,
  };
  const activePoints = [randomPointIndex];

  const getNeighbors = (p: {x: number; y: number}) => {
    const x = gridX(p);
    const y = gridY(p);

    const options = [-2, -1, 0, 1, 2]
      .flatMap(dx => [-2, -1, 0, 1, 2].map(dy => [x + dx, y + dy]))
      .filter(([x, y]) => x >= 0 && y >= 0 && x <= gridWidth && y <= gridHeight)
      .map(([x, y]) => x + y * gridWidth);

    return options;
  };

  const r_earth = 6378 * 1000;

  while (activePoints.length > 0) {
    const point = points[activePoints[Math.floor(Math.random() * activePoints.length)]];

    let sampleSize = k + 1;
    for (let i = 0; i < sampleSize; i++) {
      if (i === k) {
        activePoints.splice(activePoints.indexOf(gridIndex(point)), 1);
      }

      const angle = randomBetweenInterval(0, Math.PI * 2);
      const distanceFromPoint = randomBetweenInterval(radius, radius * 2);

      const newPoint = {
        x: point.x + ((Math.cos(angle) * distanceFromPoint) / r_earth) * (180 / Math.PI),
        y:
          point.y +
          (((Math.sin(angle) * distanceFromPoint) / r_earth) * (180 / Math.PI)) /
            Math.cos((point.x * Math.PI) / 180),
      };

      const index = gridIndex(newPoint);

      const occupied = points[index];
      if (occupied) continue;
      if (!isPointInsidePolygon({lng: newPoint.x, lat: newPoint.y}, vertices)) {
        sampleSize += 1;
        continue;
      }
      const neighbors = getNeighbors(newPoint);
      if (
        neighbors.every(n => {
          if (!points[n]) return true;
          return distance([newPoint.x, newPoint.y], [points[n].x, points[n].y]) > radius;
        })
      ) {
        points[index] = newPoint;
        activePoints.push(index);
        break;
      }
    }
  }

  return Object.values(points).map(p => ({lng: p.x, lat: p.y}));
}
```
{% endcode %}

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

