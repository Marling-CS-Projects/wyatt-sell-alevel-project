import {Button, Text, VStack} from '@chakra-ui/react';
import {useAuth0} from '@auth0/auth0-react';

export const LoginContainer = () => {
	const {loginWithRedirect} = useAuth0();

	return (
		<VStack>
			<Button onClick={loginWithRedirect} colorScheme={'blue'}>
				Login
			</Button>
			<Text>Not logged in</Text>;
		</VStack>
	);
};
