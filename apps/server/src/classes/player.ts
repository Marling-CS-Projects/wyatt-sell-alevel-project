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

	constructor(socket: Socket, game: Game) {
		this.socket = socket;
		this.game = game;
		this.id = socket.user.sub;
		this.status = 'alive';
		this.pref = undefined;
		this.type = game.hunted.length > game.hunters.length ? 'hunter' : 'hunted';
		this.user = socket.user;
	}

	updatePref(pref: 'hunted' | 'hunter') {
		this.pref = pref;
		if (this.game[pref === 'hunted' ? 'hunted' : 'hunters'].length >= 20) {
			this.type = pref === 'hunted' ? 'hunter' : 'hunted';
		} else {
			this.type = pref;
		}
		return this.type;
	}

	updateStatus(status: 'disconnected' | 'spectating' | 'alive') {
		this.status = status;
	}
}
