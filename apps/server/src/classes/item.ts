import {
	GameOptions,
	isPointInsidePolygon,
	randomBetweenInterval,
	randomBetweenIntervalInt,
	randomPointInsidePolygon,
} from '@monorepo/shared';
import {distance} from '@monorepo/shared/src/utils/haversine';
import {v4 as uuid} from 'uuid';
import {io} from '..';
import {Game} from './game';
import {Player} from './player';

export class Item {
	id: string;
	location: {
		lat: number;
		lng: number;
	};
	info: {
		name: string;
		code: string;
		type: 'hunter' | 'hunted';
		rarity: number;
		baseRarity: number;
		duration: number;
	};
	game: Game;
	active: boolean;

	activeStart?: number;

	constructor(game: Game, type: 'hunter' | 'hunted', location: {lat: number; lng: number}) {
		this.id = uuid();
		this.location = location;
		this.game = game;
		this.info = this.generateItemType(type);
		this.active = false;
	}

	private generateItemType(type: 'hunter' | 'hunted') {
		const types = {
			hunted: [
				{
					name: 'GPS Jammer',
					code: 'gpsj',
					baseRarity: 1,
					baseDuration: 5,
				},
				// {
				// 	name: 'Foil blanket',
				// 	code: 'foil',
				// 	baseRarity: 1,
				// },
				// {
				// 	name: 'Disguise',
				// 	code: 'disg',
				// 	baseRarity: 2,
				// },
				// {
				// 	name: 'Stingray',
				// 	code: 'stry',
				// 	baseRarity: 3,
				// },
			],
			hunter: [
				// {
				// 	name: 'Phone triangulator',
				// 	code: 'ptgr',
				// 	baseRarity: 1,
				// },
				{
					name: 'Drone search',
					code: 'drse',
					baseRarity: 2,
					baseDuration: 5,
				},
			],
		};
		const typesToSelect = types[type].flatMap(type =>
			Array(10 - type.baseRarity * 3).fill(type)
		) as typeof types['hunter' | 'hunted'];

		const item = typesToSelect[Math.floor(Math.random() * typesToSelect.length)];

		const rarityArr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3].filter(v => v >= item.baseRarity) as (
			| 1
			| 2
			| 3
		)[];
		const rarity = rarityArr[Math.floor(Math.random() * rarityArr.length)];
		const duration = item.baseDuration * (rarity - item.baseRarity + 1);

		return {
			...item,
			type,
			rarity,
			duration,
		};
	}

	use(player: Player) {
		this.activeStart = Date.now();

		switch (this.info.code) {
			case 'gpsj':
				const nearbyHunters = this.game.hunter.filter(
					p =>
						p.location &&
						player.location &&
						distance(p.location, player.location) < [1000, 2000, 3000][this.info.rarity - 1]
				);
				nearbyHunters.forEach(p => {
					p.socket.emit('effect-active', {
						id: this.id,
						code: 'gpsj',
						data: undefined,
						duration: this.info.duration,
					});
				});
				setTimeout(() => {
					nearbyHunters.forEach(p => {
						p.socket.emit('effect-inactive', {
							id: this.id,
						});
					});
				}, this.info.duration * 60 * 1000);
				break;
			case 'drse':
				const playersInRange = this.game.hunted.filter(p => {
					console.log(distance(p.location!, player.location!));
					return (
						p.location &&
						player.location &&
						distance(p.location, player.location) < [1000, 2000][this.info.rarity - 2]
					);
				});

				player.socket.emit('effect-active', {
					id: this.id,
					code: 'drse',
					data: [
						...playersInRange.map(p => ({
							point: {lat: p.location!.latitude, lng: p.location!.longitude},
							intensity: randomBetweenIntervalInt(20, 50),
						})),
						...Array(0, [4, 2][this.info.rarity - 2])
							.fill(0)
							.map(() => ({
								point: generateRandomPointInRange(
									player.location!,
									[2000, 3000][this.info.rarity - 2],
									this.game.options.vertices
								),
								intensity: randomBetweenIntervalInt(20, 50),
							})),
					],
					duration: this.info.duration,
				});
				playersInRange.forEach(playerRange => {
					playerRange.socket.emit('effect-active', {
						id: this.id,
						code: 'drsehunted',
						data: undefined,
						duration: this.info.duration,
					});
				});

				setTimeout(() => {
					player.socket.emit('effect-inactive', {
						id: this.id,
					});
					playersInRange.forEach(p => {
						p.socket.emit('effect-inactive', {
							id: this.id,
						});
					});
				}, this.info.duration * 60 * 1000);

				break;
		}
		player.socket.emit('item-active', {
			id: this.id,
			start: this.activeStart,
		});
		setTimeout(() => {
			player.socket.emit('item-used', {
				id: this.id,
			});

			this.game.items = this.game.items.filter(i => i.id !== this.id);
			player.items = player.items.filter(i => i.id !== this.id);
		}, this.info.duration * 60 * 1000);
	}
}

const generateRandomPointInRange = (
	center: GeolocationCoordinates,
	radius: number,
	vertices: GameOptions['vertices']
): {lat: number; lng: number} => {
	const angle = randomBetweenInterval(0, Math.PI * 2);
	const distanceFromPoint = randomBetweenInterval(0, radius);
	const point = {x: center.longitude, y: center.latitude};
	const r_earth = 6378 * 1000;

	const newPoint = {
		lng: point.x + ((Math.cos(angle) * distanceFromPoint) / r_earth) * (180 / Math.PI),
		lat:
			point.y +
			(((Math.sin(angle) * distanceFromPoint) / r_earth) * (180 / Math.PI)) /
				Math.cos((point.x * Math.PI) / 180),
	};

	if (isPointInsidePolygon(newPoint, vertices)) {
		return newPoint;
	} else {
		return generateRandomPointInRange(center, radius, vertices);
	}
};
