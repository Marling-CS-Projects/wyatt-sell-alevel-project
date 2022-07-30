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
			(yj - gradient * xj - (point.y - inverseGradient * point.x)) /
			(inverseGradient - gradient);

		const yIntersect = gradient * xIntersect + yj - gradient * xj;

		const distance = measure(point.x, point.y, xIntersect, yIntersect);
		distances.push(distance);
	}
	return Math.min(...distances);
};

function measure(lat1: number, lng1: number, lat2: number, lng2: number) {
	const R = 6378.137; // Radius of earth in KM
	const dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180;
	const dLng = (lng2 * Math.PI) / 180 - (lng1 * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d * 1000; // meters
}
