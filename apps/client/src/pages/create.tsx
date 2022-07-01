import {CreatePage} from '../components/lobby/JoinOrCreateGame';
import {LobbyContainer} from '../components/lobby/LobbyContainer';
import {useAuth0} from '@auth0/auth0-react';
import {useSocket} from '../utils/hooks';
import {useRouter} from 'next/router';
import {useEffect} from 'react';

export default () => {
	const router = useRouter();
	const {user} = useAuth0();
	const socket = useSocket();
	useEffect(() => {
		if (!user || socket) void router.push('/');
	}, [user, socket]);

	return (
		<LobbyContainer>
			<CreatePage />
		</LobbyContainer>
	);
};
