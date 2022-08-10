export type ServerMessages = {
	'player-connected': Player;
	'player-reconnected': Player;
	'player-disconnected': {id: string};
	'player-updated': Player;
	'player-boundary': {
		id: string;
		outside: boolean;
	};
	'game-init': {
		id: string;
		code: string;
		options: GameOptions;
		hasStarted: boolean;
	};
	'player-location': {
		id: string;
		location: GeolocationCoordinates | null;
	};
	'game-start': {
		startTime: number;
	};
};

export type Player = {
	id: string;
	picture: string;
	username: string;
	type: 'hunter' | 'hunted';
	isHost: boolean;
	location?: GeolocationCoordinates | null;
};

export type ServerResponses = {
	code: {
		code: string;
	};
};

export type ClientMessages = {
	'game-start': true;
	'player-pref': 'hunter' | 'hunted';
	'player-location': GeolocationCoordinates;
};

export type ServerToClientEvents = {
	[key in keyof ServerMessages]: (data: ServerMessages[key]) => void;
};

export type ClientToServerEvents = {
	[key in keyof ClientMessages]: (data: ClientMessages[key]) => void;
};

// Other types
export interface GameOptions {
	max: {
		hunter: number;
		hunted: number;
		total?: number;
	};
	vertices: {lat: number; lng: number}[];
}
