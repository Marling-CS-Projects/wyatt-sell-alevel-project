import {ReactElement, useEffect} from 'react';
import {useAtom} from 'jotai';
import {socketAtom} from '../utils/atoms';
import {useGame, useMe, usePlayers} from '../utils/hooks';
import {toast} from 'react-hot-toast';
import {ServerToClientEvents} from '@monorepo/shared/src/index';
import {useAuth0} from '@auth0/auth0-react';

export const SocketHandler = (props: {children: ReactElement | null}) => {
	const [socket, setSocket] = useAtom(socketAtom);
	const [players, setPlayers] = usePlayers();
	const [game, setGame] = useGame();
	const {user} = useAuth0();
	const me = useMe();

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
			toast.error(`${players.find(p => p.id === data.id)!.username} disconnected`);
		},
		'player-updated': data => {
			setPlayers(prev => [...prev.filter(p => p.id !== data.id), data]);
		},
		'player-location': data => {
			setPlayers(prev => prev.map(p => (p.id === data.id ? {...p, location: data.location} : p)));
		},
		'player-caught': data => {
			setPlayers(prev => prev.map(p => (p.id === data.id ? {...p, status: 'caught'} : p)));
			if (data.id !== me?.id) {
				toast[me?.type === 'hunter' ? 'success' : 'error'](`${data.username} caught!`);
			} else {
				toast.error(`You were caught! Game Over`);
				setTimeout(() => {
					socket?.disconnect();
					setGame(null);
					setSocket(null);
				}, 3000);
			}
		},
		'player-boundary': data => {
			toast.error(
				`${players.find(p => p.id === data.id)!.username} is ${
					data.outside ? '' : 'no longer'
				} out of bounds`
			);
		},
		'player-catch-on': data => {
			if (me) {
				setPlayers(prev => [
					...prev.filter(p => p.id !== me.id),
					{...me, catching: {id: data.id, username: data.username}},
				]);
			}
		},
		'player-catch-off': () => {
			if (me) {
				setPlayers(prev => [...prev.filter(p => p.id !== me.id), {...me, catching: null}]);
			}
		},
		'game-start': data => {
			setGame(prev => ({
				...prev!,
				hasStarted: true,
				startTime: data.startTime,
			}));
		},
		'game-end': data => {
			setGame(prev => ({
				...prev!,
				hasEnded: true,
				winningTeam: data.team,
			}));
		},
		'item-pickup': data => {
			const item = game?.items.find(i => i.id === data.id)!;
			if (me) {
				setPlayers(prev => [
					...prev.filter(p => p.id !== me.id),
					{...me, items: [...(me.items || []), item]},
				]);
			}
			setGame(prev => ({
				...prev!,
				items: prev!.items.filter(i => i.id !== data.id),
			}));
		},
		'item-remove': data => {
			setGame(prev => ({
				...prev!,
				items: prev!.items.filter(i => i.id !== data.id),
			}));
		},
		'item-drop': data => {
			if (me?.items) {
				setPlayers(prev => [
					...prev.filter(p => p.id !== me.id),
					{...me, items: me.items?.filter(i => i.id !== data.id)},
				]);
				setGame(prev => ({
					...prev!,
					items: [...prev!.items, data],
				}));
			}
		},
		'item-add': data => {
			setGame(prev => ({
				...prev!,
				items: [...prev!.items, data],
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
	}, [socket, players, game, user, me]);

	return props.children;
};
