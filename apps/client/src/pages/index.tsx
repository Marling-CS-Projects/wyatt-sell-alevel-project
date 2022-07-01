import {
	Avatar,
	Grid,
	Heading,
	VStack,
	Text,
	SimpleGrid,
	Image,
	Wrap,
	WrapItem,
	Flex,
	Box,
	Button,
	HStack,
	Stack,
	useForceUpdate,
} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import {io, Socket} from 'socket.io-client';
import Profile from '../components/Profile';
import {getCookie} from '../utils/utils';
import {useAuth0} from '@auth0/auth0-react';
import {useAtom} from 'jotai';
import {socketAtom} from '../utils/atoms';
import {
	ClientToServerEvents,
	ServerMessages,
	ServerToClientEvents,
} from '@monorepo/shared';
import {PrefButtons} from '../components/PrefButtons';
import {usePlayers} from '../utils/hooks';
import {UserIcon} from '../components/lobby/UserIcon';
import {PlayerContainer} from '../components/lobby/PlayerContainer';
import {LoginContainer} from '../components/lobby/LoginContainer';
import {LobbyInner} from '../components/lobby/LobbyInner';
import {LobbyContainer} from '../components/lobby/LobbyContainer';
import {JoinOrCreateGame} from '../components/lobby/JoinOrCreateGame';

const IndexInner = () => {
	const [socket, setSocket] = useAtom(socketAtom);
	const {isAuthenticated, isLoading} = useAuth0();

	if (isLoading) return <h1>Loading...</h1>;

	return (
		<LobbyContainer>
			{isAuthenticated ? (
				socket ? (
					<LobbyInner />
				) : (
					<JoinOrCreateGame />
				)
			) : (
				<LoginContainer />
			)}
		</LobbyContainer>
	);
};

export default function () {
	return <IndexInner />;
}
