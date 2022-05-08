import {Heading} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import Profile, {OtherProfile} from '../components/Profile';
import {getCookie} from '../utils/utils';
import {useAuth0} from '@auth0/auth0-react';
import {isUnauthorizedError} from '@thream/socketio-jwt';

export default function () {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [messages, setMessages] = useState<string[]>([]);
	const {user, getIdTokenClaims, loginWithRedirect, getAccessTokenSilently} =
		useAuth0();

	useEffect(() => {
		(async () => {
			if (!socket && user) {
				const token = await getIdTokenClaims();
				const newSocket = io(`http://localhost:8888`, {
					transports: ['websocket'],
					auth: {token: `Bearer ${token?.__raw}`},
				});
				setSocket(newSocket);
			}
			if (socket) {
				socket.on('connect_error', error => {
					console.error(error);
					if (isUnauthorizedError(error)) {
						console.log('User token has expired');
					}
				});

				socket.on('message', (message: string) => {
					setMessages(messages => [...messages, message]);
				});
			}
		})();
	}, [socket, user, setSocket, setMessages]);

	return (
		<>
			<Heading>Hello world!</Heading>
			<button onClick={loginWithRedirect}>Login</button>
			<Profile />
			<OtherProfile />
			<p>Socket messages:</p>
			<ul>
				{messages.map(message => (
					<li key={message}>{message}</li>
				))}
			</ul>
		</>
	);
}
