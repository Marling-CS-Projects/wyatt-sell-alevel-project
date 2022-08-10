import {useUser} from '../utils/hooks';
import {useAuth0} from '@auth0/auth0-react';
import useSWR from 'swr';
import {Avatar, HStack, Text} from '@chakra-ui/react';

export default function Profile() {
	const {user, isAuthenticated, isLoading, logout} = useAuth0();

	if (!isAuthenticated || !user) return null;
	if (isLoading) return <div>Loading...</div>;

	return (
		<HStack justifyContent={'center'}>
			<Avatar src={user.picture} />
			<Text fontSize={'xl'} pr={4}>
				{user.name}
			</Text>
			<button onClick={() => logout({returnTo: window.location.origin})}>
				Logout
			</button>
		</HStack>
	);
}
