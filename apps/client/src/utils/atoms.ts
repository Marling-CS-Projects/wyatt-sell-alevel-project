import {Socket} from 'socket.io-client';
import {atom} from 'jotai';
import {
	ClientToServerEvents,
	ServerMessages,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {atomWithStorage} from 'jotai/utils';
import {ClientPlayer} from './types';

export const socketAtom = atom<Socket<
	ServerToClientEvents,
	ClientToServerEvents
> | null>(null);

export const playersAtom = atom<ClientPlayer[]>([]);

export const gameAtom = atom<
	(ServerMessages['game-init'] & {startTime?: number}) | null
>(null);

export const locationAtom = atom<GeolocationCoordinates | null>(null);
