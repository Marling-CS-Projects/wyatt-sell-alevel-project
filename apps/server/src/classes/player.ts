import {Socket} from 'socket.io';
import {Game} from './game';
import {userType} from '../types';
import {
	ClientToServerEvents,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';

export class Player {
	socket: Socket<ClientToServerEvents, ServerToClientEvents>;
	game: Game;
	id: string;
	status: 'disconnected' | 'spectating' | 'alive';
	pref?: 'hunted' | 'hunter';
	type: 'hunted' | 'hunter';
	user: userType;
	isHost: boolean;
	location: GeolocationCoordinates | null;

	constructor(socket: Socket, game: Game) {
		this.socket = socket;
		this.game = game;
		this.id = socket.user.sub;
		this.status = 'alive';
		this.pref = undefined;
		this.user = socket.user;
		this.isHost = !game.players.length;
		this.type = game.hunted.length > game.hunter.length ? 'hunter' : 'hunted';
		this.location = null;

		game.addPlayer(this);
		socket.join(game.id);
		socket.join(game.id + this.type);
	}

	updatePref(pref: 'hunted' | 'hunter') {
		this.pref = pref;
		const newType = this.game.updatePlayer(this.id, this.pref);
		if (newType !== this.type) {
			this.socket.leave(this.game.id + this.type);
			this.type = newType;
			this.socket.join(this.game.id + newType);
		}
		return this.type;
	}

	getPublic() {
		return {
			id: this.id,
			status: this.status,
			pref: this.pref,
			type: this.type,
			isHost: this.isHost,
			user: this.user,
		};
	}
}
