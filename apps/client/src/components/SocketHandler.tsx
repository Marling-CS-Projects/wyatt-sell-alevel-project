import {ReactElement, ReactNode, useEffect} from 'react';
import {useAtom} from 'jotai';
import {socketAtom} from '../utils/atoms';
import {usePlayers, useSocket} from '../utils/hooks';

export const SocketHandler = (props: {children: ReactElement | null}) => {
	const [socket, setSocket] = useAtom(socketAtom);
	const [players, setPlayers] = usePlayers();

	useEffect(() => {
		(async () => {
			if (socket) {
				socket.on('user-connected', message => {
					setPlayers(users => [...users, message]);
				});
				socket.on('user-disconnected', message => {
					setPlayers(users => users.filter(user => user.id !== message.id));
				});
				socket.on('user-updated', ({type, data}) => {
					if (type !== 'type') return;
					setPlayers(users => [
						...users.filter(u => u.id !== data.id),
						{...users.find(u => u.id === data.id)!, type: data.type},
					]);
				});
				socket.on('connect_error', error => {
					// TODO: Replace with react-hot-toast later
					console.error(error.name);
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
