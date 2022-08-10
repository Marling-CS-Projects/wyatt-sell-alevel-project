import {v4 as uuid} from 'uuid';
import {Player} from './player';
import {generateJoinCode, polygonArea} from '../utils/helper';
import {Item} from './item';
import {GameOptions} from '@monorepo/shared/src/index';
import {io} from '../index';

export class Game {
	id: string;
	creationTime: number;
	startTime?: number;
	players: Player[];
	hunter: Player[];
	hunted: Player[];
	// items: Item[];
	host?: Player;
	hasStarted: boolean;
	joinCode: string;
	options: GameOptions;

	private generateItems = () => {
		// For now, we'll use a box around Stroud, but this is useful for future geofencing https://www.baeldung.com/cs/geofencing-point-inside-polygon
		// 51.756754, -2.258926
		// to
		// 51.735922, -2.197053
		// const area = polygonArea(this.options.vertices);
		//
		// console.log(area);
		// // 40 is our density constant
		// const totalItems = area / 40;
		//
		// return [...new Array(Math.floor(totalItems))].fill(0).map(() => new Item());
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
		// this.items = this.generateItems();
		this.joinCode = generateJoinCode();
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

	sendGameData(id: string) {
		const primaryPlayer = this.players.find(p => p.id === id)!;
		const socket = primaryPlayer.socket;

		socket.emit('game-init', {
			id: socket.game.id,
			code: socket.game.joinCode,
			options: socket.game.options,
			hasStarted: socket.game.hasStarted,
		});

		// Sends data about the new player to all other players
		socket
			.to(socket.game.id)
			.emit(
				`player-${this.hasStarted ? 're' : ''}connected`,
				primaryPlayer.getPublic()
			);
		primaryPlayer.emitLocation();

		for (const player of this.players) {
			if (player.status === 'disconnected') continue;

			socket.emit('player-connected', {
				...player.getPublic(),
				location: player.getCanAccessLocation(id) ? player.location : undefined,
			});
		}
	}

	start() {
		this.hasStarted = true;
		this.startTime = Date.now();
		io.to(this.id).emit('game-start', {
			startTime: this.startTime,
		});
	}
}
