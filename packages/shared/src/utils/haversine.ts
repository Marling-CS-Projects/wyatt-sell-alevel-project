const asin = Math.asin;
const cos = Math.cos;
const sin = Math.sin;
const sqrt = Math.sqrt;
const PI = Math.PI;

// equatorial mean radius of Earth (in meters)
const R = 6378137;

function squared(x: number) {
	return x * x;
}
function toRad(x: number) {
	return (x * PI) / 180.0;
}
function hav(x: number) {
	return squared(sin(x / 2));
}

export function distance(
	a: [number, number] | {lat: number; lng: number},
	b: [number, number] | {lat: number; lng: number}
) {
	const aLat = toRad(Array.isArray(a) ? a[1] : a.lat);
	const bLat = toRad(Array.isArray(b) ? b[1] : b.lat);
	const aLng = toRad(Array.isArray(a) ? a[0] : a.lng);
	const bLng = toRad(Array.isArray(b) ? b[0] : b.lng);

	const ht = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLng - aLng);
	return 2 * R * asin(sqrt(ht)); // in meters
}
