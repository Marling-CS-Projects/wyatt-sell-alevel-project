import useSWR from 'swr';
import {useAtom} from 'jotai';
import {gameAtom, locationAtom, playersAtom, socketAtom} from './atoms';
import {useAuth0} from '@auth0/auth0-react';

export const useUser = () => useSWR('/user');

export const useSocket = () => useAtom(socketAtom)[0];
export const usePlayers = () => useAtom(playersAtom);
export const useGame = () => useAtom(gameAtom);
export const useLocation = () => useAtom(locationAtom);
export const useMe = () => {
	const {user} = useAuth0();
	if (!user) return null;
	return useAtom(playersAtom)[0].find(p => user.sub === p.id) ?? null;
};
