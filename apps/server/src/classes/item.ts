import {randomBetweenInterval} from '../utils/helper';

export class Item {
	location: {
		lat: number;
		long: number;
	};

	constructor() {
		// For now, we'll use a box around Stroud, but this is useful for future geofencing https://www.baeldung.com/cs/geofencing-point-inside-polygon
		// 51.756754, -2.258926
		// to
		// 51.735922, -2.197053
		this.location = {
			lat: randomBetweenInterval(51.735922, 51.756754),
			long: -randomBetweenInterval(2.197053, 2.258926),
		};
	}
}
