import {Socket} from 'socket.io';
import {Game} from './game';
import {userType} from '../types';

export class Player {
	socket: Socket;
	game: Game;
	id: string;
	status: 'disconnected' | 'spectating' | 'alive';
	pref?: 'hunted' | 'hunter';
	type: 'hunted' | 'hunter';
	user: userType;
	isHost: boolean;

	constructor(socket: Socket, game: Game) {
		this.socket = socket;
		this.game = game;
		this.id = socket.user.sub;
		this.status = 'alive';
		this.pref = undefined;
		this.user = socket.user;
		this.isHost = !game.players.length;
		this.type = game.hunted.length > game.hunter.length ? 'hunter' : 'hunted';
		game.addPlayer(this);
	}

	updatePref(pref: 'hunted' | 'hunter') {
		this.pref = pref;
		this.type = this.game.updatePlayer(this.id, this.pref);
		return this.type;
	}
}
