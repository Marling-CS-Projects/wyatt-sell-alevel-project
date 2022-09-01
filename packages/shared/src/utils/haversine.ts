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
	a: [number, number] | {lat: number; lng: number} | GeolocationCoordinates,
	b: [number, number] | {lat: number; lng: number} | GeolocationCoordinates
) {
	const aLat = toRad(Array.isArray(a) ? a[1] : 'lat' in a ? a.lat : a.latitude);
	const bLat = toRad(Array.isArray(b) ? b[1] : 'lat' in b ? b.lat : b.latitude);
	const aLng = toRad(Array.isArray(a) ? a[0] : 'lng' in a ? a.lng : a.longitude);
	const bLng = toRad(Array.isArray(b) ? b[0] : 'lng' in b ? b.lng : b.longitude);

	const ht = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLng - aLng);
	return 2 * R * asin(sqrt(ht)); // in meters
}
