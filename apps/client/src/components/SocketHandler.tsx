import {ReactElement, useEffect} from 'react';
import {useAtom} from 'jotai';
import {socketAtom} from '../utils/atoms';
import {useGame, usePlayers} from '../utils/hooks';
import {toast} from 'react-hot-toast';

export const SocketHandler = (props: {children: ReactElement | null}) => {
	const [socket, setSocket] = useAtom(socketAtom);
	const [, setPlayers] = usePlayers();
	const [, setGame] = useGame();

	useEffect(() => {
		(async () => {
			if (socket) {
				socket.on('player-connected', message => {
					setPlayers(users => [...users, message]);
				});
				socket.on('player-disconnected', message => {
					setPlayers(users => users.filter(user => user.id !== message.id));
				});
				socket.on('player-updated', ({id, ...data}) => {
					setPlayers(users => [
						...users.filter(u => u.id !== id),
						{...users.find(u => u.id === id)!, ...data},
					]);
				});
				socket.on('player-location', message => {
					setPlayers(players =>
						players.map(p =>
							p.id === message.id ? {...p, location: message.location} : p
						)
					);
				});
				socket.on('player-boundary', message => {
					setPlayers(players => {
						toast.error(
							`${players.find(p => p.id === message.id)!.username} is ${
								message.outside ? '' : 'no longer'
							} out of bounds`
						);
						return players;
					});
				});
				socket.on('game-start', message => {
					setGame(prev => ({
						...prev!,
						hasStarted: true,
						startTime: message.startTime,
					}));
				});
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
				return () => {
					socket.disconnect();
				};
			}
		})();
	}, [socket]);
	return props.children;
};
