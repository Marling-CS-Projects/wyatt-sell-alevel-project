import {Socket} from 'socket.io-client';
import {atom} from 'jotai';
import {
	ClientToServerEvents,
	ServerMessages,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';

export const socketAtom = atom<Socket<
	ServerToClientEvents,
	ClientToServerEvents
> | null>(null);

export const playersAtom = atom<ServerMessages['user-connected'][]>([]);
