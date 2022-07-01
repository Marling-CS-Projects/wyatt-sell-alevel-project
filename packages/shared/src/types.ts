export type ServerMessages = {
	'user-connected': {
		id: string;
		picture: string;
		username: string;
		type: 'hunter' | 'hunted';
		isHost: boolean;
	};
	'user-disconnected': {id: string};
	'user-updated': {
		type: keyof UserUpdate;
		data: {id: string} & UserUpdate[keyof UserUpdate];
	};
	'game-init': {
		id: string;
		code: string;
		options: Record<string, any>;
	};
};

export type ServerResponses = {
	code: {
		code: string;
	};
};

type UserUpdate = {
	type: {
		type: 'hunter' | 'hunted';
	};
};

export type ClientMessages = {
	'player-pref': 'hunter' | 'hunted';
	'game-start': true;
};

export type ServerToClientEvents = {
	[key in keyof ServerMessages]: (data: ServerMessages[key]) => void;
};

export type ClientToServerEvents = {
	[key in keyof ClientMessages]: (data: ClientMessages[key]) => void;
};
