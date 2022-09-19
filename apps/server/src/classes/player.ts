import {Socket} from 'socket.io';
import {Game} from './game';
import {userType} from '../types';
import {
	ClientToServerEvents,
	isPointInsidePolygon,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {io} from '../index';
import {distance} from '@monorepo/shared/src/utils/haversine';
import {Item} from './item';

export class Player {
	socket: Socket<ClientToServerEvents, ServerToClientEvents>;
	game: Game;
	id: string;
	status: 'disconnected' | 'caught' | 'alive';
	pref?: 'hunted' | 'hunter';
	type: 'hunted' | 'hunter';
	user: userType;
	isHost: boolean;
	location: GeolocationCoordinates | null;
	isOutside: boolean;
	catchers: Player[] = [];
	catching: Player | null = null;
	items: Item[];

	constructor(socket: Socket, game: Game) {
		this.socket = socket;
		this.game = game;
		this.id = socket.user.sub;
		this.status = 'alive';
		this.pref = undefined;
		this.user = socket.user;
		this.isHost = !game.players.length;
		this.type = game.addPlayer(this);
		this.location = null;
		this.isOutside = false;
		this.items = [];

		console.log(game.id);

		socket.join(game.id);
		socket.join(game.id + this.type);
	}

	updatePref(pref: 'hunted' | 'hunter') {
		this.pref = pref;
		const newType = this.game.updatePlayer(this.id, this.pref);
		if (newType !== this.type) {
			this.socket.leave(this.game.id + this.type);
			this.socket.join(this.game.id + newType);
			this.type = newType;
			this.emitAll();
		}

		if (this.catchers && this.type === 'hunter') {
			this.catchers.forEach(c => c.unsetCatchable());
		} else if (this.catching && this.type === 'hunted') {
			this.unsetCatchable();
		}

		return this.type;
	}

	pickupItem(itemId: string) {
		const item = this.game.pickupItem(itemId);
		if (!item) return;
		this.items.push(item);
		this.socket.emit('item-pickup', {
			id: item.id,
		});
		this.socket.to(this.game.id + this.type).emit('item-remove', {
			id: item.id,
		});
	}

	dropItem(itemToDrop: {id: string; location: Item['location']}) {
		const item = this.items.find(i => i.id === itemToDrop.id);
		if (!item) return;
		item.location = itemToDrop.location;
		this.items = this.items.filter(i => i.id === itemToDrop.id);
		this.game.dropItem(item);
		this.socket.emit('item-drop', {
			id: item.id,
			location: item.location,
			info: item.info,
			active: false,
		});
		this.socket.to(this.game.id + this.type).emit('item-add', {
			id: item.id,
			location: item.location,
			info: item.info,
			active: false,
		});
	}

	useItem(data: {id: string}) {
		const item = this.items.find(i => i.id === data.id);
		if (!item) return;
		item.use(this);
	}

	getPublic() {
		return {
			id: this.id,
			status: this.status,
			picture: this.user.picture,
			username: this.user.given_name,
			pref: this.pref,
			type: this.type,
			isHost: this.isHost,
			user: this.user,
		};
	}

	getCanAccessLocation(playerId: string) {
		if (this.type === 'hunted') return false;
		if (this.game.hunter.find(p => p.id === playerId)) return true;
	}

	disconnect() {
		if (this.status !== 'caught') {
			this.socket.to(this.game.id).emit('player-disconnected', {id: this.id});
			this.status = 'disconnected';
		}
	}

	emitInfo() {
		io.to(this.game.id).emit('player-updated', this.getPublic());
	}

	emitLocation(socket?: Player['socket']) {
		if (this.type === 'hunter') {
			(socket || io.to(this.game.id + 'hunter')).emit('player-location', {
				id: this.id,
				location: this.location,
			});
		}
	}

	emitAll() {
		this.emitInfo();
		this.emitLocation();
	}

	updateLocation(location: GeolocationCoordinates) {
		if (this.status === 'caught') return;

		this.location = location;

		if (this.type === 'hunter') {
			this.socket.to(this.game.id + 'hunter').emit('player-location', {
				id: this.id,
				location: this.location,
			});
		} else {
			if (this.catchers.length) {
				this.catchers.forEach(c => {
					if (c.location && distance(c.location, this.location!) > 400) {
						c.unsetCatchable();
					}
				});
			}
		}

		const playerInRange = this.game[this.type === 'hunter' ? 'hunted' : 'hunter'].filter(p => {
			return p.location && distance(p.location, this.location!) <= 400;
		})[0];

		if (playerInRange) {
			if (this.type === 'hunted') {
				playerInRange.setCatchable(this);
			} else {
				this.setCatchable(playerInRange);
			}
		} else if (this.catching) {
			this.unsetCatchable();
		}

		const isOutside = !isPointInsidePolygon(
			{lat: this.location.latitude, lng: this.location.longitude},
			this.game.options.vertices
		);

		if (this.isOutside && !isOutside) {
			this.isOutside = false;
			this.socket.to(this.game.id).emit('player-boundary', {
				id: this.id,
				outside: false,
			});
		}
		if (isOutside && !this.isOutside) {
			this.isOutside = true;
			this.socket.to(this.game.id).emit('player-boundary', {
				id: this.id,
				outside: true,
			});
		}
	}

	catchPlayer(data: {id: string}) {
		if (this.catching?.id !== data.id) return;
		this.catching.catch();
	}

	catch() {
		if (this.type === 'hunter') return;
		this.status = 'caught';
		io.to(this.game.id).emit('player-caught', this.getPublic());
		this.game.catch(this);
	}

	setCatchable(player: Player) {
		this.catching = player;
		player.catchers.push(this);
		this.socket.emit('player-catch-on', player.getPublic());
	}

	unsetCatchable() {
		if (this.catching) {
			this.catching.catchers = [];
			this.socket.emit('player-catch-off', {id: this.catching.id});
			this.catching = null;
		}
	}
}
