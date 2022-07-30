import {Socket} from 'socket.io';
import {Game} from './game';
import {userType} from '../types';
import {
	ClientToServerEvents,
	isPointInsidePolygon,
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
	isOutside: boolean;

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
		this.isOutside = false;

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

	updateLocation(location: GeolocationCoordinates) {
		this.location = location;
		if (this.socket.player.type === 'hunter') {
			this.socket.to(this.game.id + 'hunter').emit('player-location', {
				id: this.id,
				location: this.location,
			});
		}
		const isInside = isPointInsidePolygon(
			{lat: this.location.latitude, lng: this.location.longitude},
			this.game.options.vertices
		);

		if (this.isOutside && isInside) {
			this.isOutside = false;
			this.socket.to(this.game.id).emit('player-boundary', {
				id: this.id,
				outside: false,
			});
		}
		if (!isInside) {
			this.isOutside = true;
			this.socket.to(this.game.id).emit('player-boundary', {
				id: this.id,
				outside: true,
			});
		}
	}
}
