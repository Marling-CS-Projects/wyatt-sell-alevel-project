import {ReactNode} from 'react';
import {Box, Heading, Text} from '@chakra-ui/react';
import {LobbyInner} from './LobbyInner';
import {LoginContainer} from './LoginContainer';
import Profile from '../Profile';

export const LobbyContainer = (props: {children: ReactNode}) => {
	return (
		<Box w={'full'}>
			<Heading p={6} textAlign={'center'}>
				Hunted: The Game
			</Heading>
			<Profile />
			{props.children}
		</Box>
	);
};
