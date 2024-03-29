export type ServerMessages = {
	'player-connected': Player;
	'player-reconnected': Player;
	'player-disconnected': {id: string};
	'player-updated': Player;
	'player-boundary': {
		id: string;
		outside: boolean;
	};
	'player-catch-on': Player;
	'player-catch-off': {id: string};
	'player-caught': Player;
	'game-init': {
		id: string;
		code: string;
		options: GameOptions;
		hasStarted: boolean;
		items: string[]; // JSON stringified items;
	};
	'player-location': {
		id: string;
		location: GeolocationCoordinates | null;
	};
	'game-start': {
		startTime: number;
	};
	'game-end': {
		team: 'hunter' | 'hunted';
	};
	'game-update': Partial<ServerMessages['game-init']>;
	'item-pickup': {
		id: string;
	};
	'item-remove': {
		id: string;
	};
	'item-add': Item;
	'item-drop': Item;
	'effect-active': {
		id: string;
		code: keyof EffectUseData;
		data: EffectUseData[keyof EffectUseData];
		duration: Item['info']['duration'];
	};
	'effect-inactive': {
		id: string;
	};
	'item-active': {id: string; start: number};
	'item-used': {id: string};
};

export type EffectUseData = {
	gpsj: undefined;
	drse: {
		point: {lat: number; lng: number};
		intensity: number;
	}[];
	drsehunted: undefined;
};

export type Player = {
	id: string;
	picture: string;
	username: string;
	type: 'hunter' | 'hunted';
	isHost: boolean;
	location?: GeolocationCoordinates | null;
	catching?: {
		id: string;
		username: string;
	} | null;
};

export type Item = {
	id: string;
	location: {
		lat: number;
		lng: number;
	};
	info: {
		name: string;
		code: string;
		type: 'hunter' | 'hunted';
		rarity: number;
		baseRarity: number;
		duration: number;
	};
	active: boolean;
	activeStart?: number;
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
	'player-catch': {id: string};
	'item-pickup': {id: string};
	'item-drop': {id: string; location: Item['location']};
	'item-use': {id: string};
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
	duration: number;
}
