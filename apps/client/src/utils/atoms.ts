import {Socket} from 'socket.io-client';
import {atom} from 'jotai';
import {
	ClientToServerEvents,
	Item,
	Player,
	ServerMessages,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {atomWithStorage} from 'jotai/utils';

export const socketAtom = atom<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

export const playersAtom = atom<(Player & {items?: Item[]})[]>([]);

export const gameAtom = atomWithStorage<
	| (Omit<ServerMessages['game-init'], 'items'> & {
			startTime?: number;
			items: Item[];
			hasEnded?: boolean;
			winningTeam?: 'hunter' | 'hunted';
	  })
	| null
>('game', null);

export const locationAtom = atom<GeolocationCoordinates | null>(null);
export const effectsAtom = atom<ServerMessages['effect-active'][]>([]);
