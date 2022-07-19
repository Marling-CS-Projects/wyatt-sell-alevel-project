import {Socket} from 'socket.io-client';
import {atom} from 'jotai';
import {
	ClientToServerEvents,
	ServerMessages,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {atomWithStorage} from 'jotai/utils';

export const socketAtom = atom<Socket<
	ServerToClientEvents,
	ClientToServerEvents
> | null>(null);

export const playersAtom = atom<
	(ServerMessages['player-connected'] & {
		location?: GeolocationCoordinates | null;
	})[]
>([]);

export const gameAtom = atomWithStorage<
	(ServerMessages['game-init'] & {hasStarted: boolean}) | null
>('game', null);
