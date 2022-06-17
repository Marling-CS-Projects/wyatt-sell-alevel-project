import {v4 as uuid} from 'uuid';
import {Player} from './player';

export class Game {
	id: string;
	players: typeof Player[];
	hunters: typeof Player[];
	hunted: typeof Player[];
	hasStarted: boolean;

	constructor() {
		this.id = uuid();
		this.players = [];
		this.hunters = [];
		this.hunted = [];
		this.hasStarted = false;
	}
}
