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

export const playersAtom = atom<ServerMessages['user-connected'][]>([]);

export const gameAtom = atomWithStorage<ServerMessages['game-init'] | null>(
	'game',
	null
);
