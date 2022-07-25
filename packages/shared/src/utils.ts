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
			yi > point.y !== yj > point.y &&
			point.x > ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
};

export const isNearPolygonEdge = (
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
		const intercept = yi - gradient * xi;
		const distance = Math.abs(gradient * point.x + intercept - point.y);
		distances.push(distance);
	}
	return Math.min(...distances);
};
