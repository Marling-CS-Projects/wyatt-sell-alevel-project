import {randomPointInsidePolygon} from '@monorepo/shared';
import {v4 as uuid} from 'uuid';
import {Game} from './game';

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
	};
	game: Game;

	constructor(game: Game, type: 'hunter' | 'hunted', location: {lat: number; lng: number}) {
		this.id = uuid();
		this.location = location;
		this.game = game;
		this.info = this.generateItemType(type);
	}

	private generateItemType(type: 'hunter' | 'hunted') {
		const types = {
			hunted: [
				{
					name: 'GPS Jammer',
					code: 'gpsj',
					baseRarity: 1,
				},
				{
					name: 'Foil blanket',
					code: 'foil',
					baseRarity: 1,
				},
				{
					name: 'Disguise',
					code: 'disg',
					baseRarity: 2,
				},
				{
					name: 'Stingray',
					code: 'stry',
					baseRarity: 3,
				},
			],
			hunter: [
				{
					name: 'Phone triangulator',
					code: 'ptgr',
					baseRarity: 1,
				},
				{
					name: 'Drone search',
					code: 'drse',
					baseRarity: 2,
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

		return {
			...item,
			type,
			rarity,
		};
	}
}
