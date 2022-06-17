import useSWR from 'swr';
import {useAtom} from 'jotai';
import {playersAtom, socketAtom} from './atoms';

export const useUser = () => useSWR('/user');

export const useSocket = () => useAtom(socketAtom)[0];
export const usePlayers = () => useAtom(playersAtom);
