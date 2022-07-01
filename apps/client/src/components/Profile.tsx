import {useUser} from '../utils/hooks';
import {useAuth0} from '@auth0/auth0-react';
import useSWR from 'swr';
import {Avatar, HStack} from '@chakra-ui/react';

export default function Profile() {
	const {user, isAuthenticated, isLoading, logout} = useAuth0();

	if (!isAuthenticated || !user) return null;
	if (isLoading) return <div>Loading...</div>;

	console.log('user picture', user.picture);

	return (
		<HStack justifyContent={'center'}>
			<Avatar src={user.picture} />
			<h2>{user.name}</h2>
			<button onClick={() => logout({returnTo: window.location.origin})}>
				Logout
			</button>
		</HStack>
	);
}
