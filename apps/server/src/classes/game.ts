import {v4 as uuid} from 'uuid';
import {Player} from './player';
import {generateJoinCode, polygonArea} from '../utils/helper';
import {Item} from './item';
import {
	GameOptions,
	getBoxPoints,
	poissonDiscSampling,
	randomPointInsidePolygon,
} from '@monorepo/shared/src/index';
import {io} from '../index';

export class Game {
	id: string;
	creationTime: number;
	startTime?: number;
	players: Player[];
	hunter: Player[];
	hunted: Player[];
	items: Item[];
	host?: Player;
	hasStarted: boolean;
	joinCode: string;
	options: GameOptions;
	timeout?: NodeJS.Timeout;

	private generateItems = () => {
		const points = poissonDiscSampling(this.options.vertices);
		return points.map((point, i) => {
			const item = new Item(this, i % 2 === 0 ? 'hunted' : 'hunted', point);
			return item;
		});
	};

	constructor(options: GameOptions) {
		this.id = uuid();
		this.creationTime = Date.now();
		this.players = [];
		this.hunter = [];
		this.hunted = [];
		this.hasStarted = false;
		this.options = {
			...options,
			max: {...options.max, total: options.max.hunted + options.max.hunter},
		};

		this.joinCode = generateJoinCode();
		this.items = this.generateItems();
	}

	addPlayer(player: Player) {
		if (this.players.length === 0) {
			this.host = player;
		}
		this.players.push(player);
		return this.updatePlayer(
			player.id,
			this.hunter.length <= this.hunted.length ? 'hunter' : 'hunted'
		);
	}

	updatePlayer(id: string, pref: 'hunter' | 'hunted') {
		const player = this.players.find(p => p.id === id);
		if (!player) throw new Error('Player not in game');
		const invertedPlayerPref = pref === 'hunter' ? 'hunted' : 'hunter';
		if (this[pref].length < this.options.max[pref]) {
			this[invertedPlayerPref] = this[invertedPlayerPref].filter(p => p.id !== id);
			this[pref].push(player);
			return pref;
		}
		return invertedPlayerPref;
	}

	sendGameData(id: string) {
		const primaryPlayer = this.players.find(p => p.id === id)!;
		const socket = primaryPlayer.socket;

		socket.emit('game-init', {
			id: socket.game.id,
			code: socket.game.joinCode,
			options: socket.game.options,
			hasStarted: socket.game.hasStarted,
			items: socket.game.items.map(item =>
				JSON.stringify({
					id: item.id,
					location: item.location,
					info: item.info,
				})
			),
		});

		// Sends data about the new player to all other players
		socket
			.to(socket.game.id)
			.emit(`player-${this.hasStarted ? 're' : ''}connected`, primaryPlayer.getPublic());
		primaryPlayer.emitLocation();

		for (const player of this.players) {
			if (player.status === 'disconnected') continue;

			socket.emit('player-connected', {
				...player.getPublic(),
				location: player.getCanAccessLocation(id) ? player.location : undefined,
			});
		}
	}

	catch(player: Player) {
		this.hunted = this.hunted.filter(p => p.id !== player.id);
		this.players = this.players.filter(p => p.id !== player.id);
		player.catchers.forEach(c => c.unsetCatchable());
		if (!this.hunted.length) {
			io.to(this.id).emit('game-end', {
				team: 'hunter',
			});
			this.timeout && clearTimeout(this.timeout);
		}
	}

	start() {
		this.hasStarted = true;
		this.startTime = Date.now();
		io.to(this.id).emit('game-start', {
			startTime: this.startTime,
		});
		this.timeout = setTimeout(() => {
			io.to(this.id).emit('game-end', {
				team: 'hunted',
			});
		}, this.options.duration * 60 * 1000);
	}
}
