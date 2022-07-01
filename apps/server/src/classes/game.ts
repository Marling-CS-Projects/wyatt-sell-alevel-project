import {v4 as uuid} from 'uuid';
import {Player} from './player';
import {generateJoinCode, polygonArea} from '../utils/helper';
import {Item} from './item';

export class Game {
	id: string;
	creationTime: number;
	players: Player[];
	hunter: Player[];
	hunted: Player[];
	items: Item[];
	host?: Player;
	hasStarted: boolean;
	joinCode: string;
	options: {
		max: {
			hunter: number;
			hunted: number;
			total: number;
		};
	};

	private generateItems = () => {
		// For now, we'll use a box around Stroud, but this is useful for future geofencing https://www.baeldung.com/cs/geofencing-point-inside-polygon
		// 51.756754, -2.258926
		// to
		// 51.735922, -2.197053
		const area = polygonArea([
			{
				x: 51.756754,
				y: 2.258926,
			},
			{
				x: 51.756754,
				y: 2.197053,
			},
			{
				x: 51.735922,
				y: 2.258926,
			},
			{
				x: 51.735922,
				y: 2.197053,
			},
		]);

		console.log(area);
		// 40 is our density constant
		const totalItems = area / 40;

		return [...new Array(Math.floor(totalItems))].fill(0).map(() => new Item());
	};

	constructor(options: {max: {hunter: number; hunted: number}}) {
		this.id = uuid();
		this.creationTime = Date.now();
		this.players = [];
		this.hunter = [];
		this.hunted = [];
		this.items = this.generateItems();
		this.hasStarted = false;
		this.joinCode = generateJoinCode();
		this.options = {
			max: {...options.max, total: options.max.hunted + options.max.hunter},
		};
	}

	addPlayer(player: Player) {
		if (this.players.length === 0) {
			this.host = player;
		}
		if (this.players.length === this.options.max.total) return false;
		this.players.push(player);
		this.updatePlayer(
			player.id,
			this.hunter.length <= this.hunted.length ? 'hunter' : 'hunted'
		);
		return true;
	}

	updatePlayer(id: string, pref: 'hunter' | 'hunted') {
		const player = this.players.find(p => p.id === id);
		if (!player) throw new Error('Player not in game');
		const invertedPlayerPref = pref === 'hunter' ? 'hunted' : 'hunter';
		if (this[pref].length < this.options.max[pref]) {
			this[invertedPlayerPref] = this[invertedPlayerPref].filter(
				p => p.id !== id
			);
			this[pref].push(player);
			return pref;
		}
		return invertedPlayerPref;
	}

	start() {
		this.hasStarted = true;
		this;
	}
}
