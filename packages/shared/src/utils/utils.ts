import {GameOptions} from '../types';
import {distance} from './haversine';

export const isPointInsidePolygon = (
	pointRaw: {lat: number; lng: number},
	polygonRaw: {lat: number; lng: number}[]
) => {
	let inside = false;
	const polygon = polygonRaw.map(p => ({x: p.lat, y: p.lng}));
	const point = {x: pointRaw.lat, y: pointRaw.lng};
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;

		const intersect =
			yi > point.y !== yj > point.y && point.x > ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
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
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;

		const gradient = (yj - yi) / (xj - xi);
		const inverseGradient = -1 / gradient;

		const xIntersect =
			(yj - gradient * xj - (point.y - inverseGradient * point.x)) / (inverseGradient - gradient);

		const yIntersect = gradient * xIntersect + yj - gradient * xj;

		const d = distance([point.x, point.y], [xIntersect, yIntersect]);
		distances.push(d);
	}
	return Math.min(...distances);
};

export const randomBetweenInterval = (min: number, max: number) => {
	return Math.random() * (max - min) + min;
};

export function dimensions(polygonRaw: {lat: number; lng: number}[]) {
	const {ranges} = getBoxPoints(polygonRaw);
	const [latMin, latMax] = ranges.lat;
	const [lngMin, lngMax] = ranges.lng;

	const width = distance([lngMin, latMin], [lngMax, latMin]);
	const height = distance([lngMin, latMin], [lngMax, latMax]);
	return {width, height};
}

export function randomPointInsidePolygon(
	ranges: {lat: number[]; lng: number[]},
	vertices: GameOptions['vertices']
): {
	lat: number;
	lng: number;
} {
	const [latMin, latMax] = ranges.lat;
	const [lngMin, lngMax] = ranges.lng;

	const point = {
		lat: randomBetweenInterval(latMin, latMax),
		lng: randomBetweenInterval(lngMin, lngMax),
	};

	if (isPointInsidePolygon(point, vertices)) {
		return point;
	} else {
		return randomPointInsidePolygon(ranges, vertices);
	}
}

export function getBoxPoints(polygonRaw: GameOptions['vertices']) {
	const polygon = polygonRaw.map(p => ({x: p.lng, y: p.lat}));

	const maxX = polygon.find(v => v.x === Math.max(...polygon.map(p => p.x)))!;
	const minX = polygon.find(v => v.x === Math.min(...polygon.map(p => p.x)))!;

	const absMaxY = Math.max(...polygon.map(p => Math.abs(p.y)));
	const maxY = polygon.find(v => Math.abs(v.y) === absMaxY)!;

	const absMinY = Math.min(...polygon.map(p => Math.abs(p.y)));
	const minY = polygon.find(v => Math.abs(v.y) === absMinY)!;

	return {
		points: [
			{
				x: minX.x,
				y: minY.y,
			},
			{
				x: maxX.x,
				y: minY.y,
			},
			{
				x: maxX.x,
				y: maxY.y,
			},
			{
				x: minX.x,
				y: maxY.y,
			},
		],
		ranges: {
			lng: [minX.x, maxX.x],
			lat: [minY.y, maxY.y],
		},
	};
}

export function poissonDiscSampling(vertices: {lng: number; lat: number}[]) {
	const radius = 200;
	const k = 10;
	const cellSize = radius / Math.sqrt(2);

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
