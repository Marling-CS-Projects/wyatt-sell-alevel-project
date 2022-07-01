export const generateJoinCode = () => {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
	return [...new Array(6)]
		.fill(0)
		.map(() => chars[Math.floor(Math.random() * chars.length + 1)])
		.join('');
};

export const randomBetweenInterval = (min: number, max: number) => {
	return Math.random() * (max - min) + min;
};

// Credit: https://stackoverflow.com/questions/16285134/calculating-polygon-area
export const polygonArea = (
	verticesRaw: {
		x: number;
		y: number;
	}[]
) => {
	let total = 0;
	const vertices = verticesRaw.map(({x, y}) => {
		const vx = x * 111320;
		const vy = y * ((40075000 * Math.cos(x)) / 360);
		return {x: vx, y: vy};
	});

	console.log(vertices);

	for (let i = 0, l = vertices.length; i < l; i++) {
		const addX = vertices[i].x;
		const addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
		const subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
		const subY = vertices[i].y;

		total += addX * addY * 0.5;
		total -= subX * subY * 0.5;
	}

	return Math.abs(total);
};
