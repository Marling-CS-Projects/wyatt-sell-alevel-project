import {ReactElement, useEffect} from 'react';
import {useAtom} from 'jotai';
import {socketAtom} from '../utils/atoms';
import {useGame, useMe, usePlayers} from '../utils/hooks';
import {toast} from 'react-hot-toast';
import {ClientPlayer} from '../utils/types';
import {
	ClientMessages,
	ServerMessages,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {useAuth0} from '@auth0/auth0-react';

export const SocketHandler = (props: {children: ReactElement | null}) => {
	const [socket, setSocket] = useAtom(socketAtom);
	const [players, setPlayers] = usePlayers();
	const [game, setGame] = useGame();
	const {user} = useAuth0();

	const listeners: Partial<ServerToClientEvents> = {
		'player-connected': data => {
			setPlayers(prev => [...prev, data]);
		},
		'player-reconnected': data => {
			setPlayers(prev => [...prev, data]);
			if (data.id !== user?.sub) {
				toast.success(`${data.username} reconnected`);
			}
		},
		'player-disconnected': data => {
			setPlayers(prev => prev.filter(p => p.id !== data.id));
			toast.error(
				`${players.find(p => p.id === data.id)!.username} disconnected`
			);
		},
		'player-updated': data => {
			setPlayers(prev => [...prev.filter(p => p.id !== data.id), data]);
		},
		'player-location': data => {
			setPlayers(prev =>
				prev.map(p => (p.id === data.id ? {...p, location: data.location} : p))
			);
		},
		'player-boundary': data => {
			toast.error(
				`${players.find(p => p.id === data.id)!.username} is ${
					data.outside ? '' : 'no longer'
				} out of bounds`
			);
		},
		'game-start': data => {
			setGame(prev => ({
				...prev!,
				hasStarted: true,
				startTime: data.startTime,
			}));
		},
	};

	useEffect(() => {
		if (socket) {
			socket.on('connect_error', error => {
				toast.error(error.name);
				setPlayers([]);
				socket.disconnect();
				setSocket(null);
			});
			socket.on('disconnect', () => {
				setPlayers([]);
				setSocket(null);
			});
			Object.entries(listeners).forEach(([name, fn]) => {
				// @ts-ignore
				socket.on(name, fn);
			});
		}

		return () => {
			if (socket) {
				Object.entries(listeners).forEach(([name, fn]) => {
					// @ts-ignore
					socket.off(name, fn);
				});
			}
		};
	}, [socket, players, game, user]);

	return props.children;
};
