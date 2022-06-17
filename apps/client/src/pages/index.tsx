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

export default function () {
	const [socket, setSocket] = useAtom(socketAtom);
	const [players, setPlayers] = usePlayers();
	const {
		user,
		getIdTokenClaims,
		loginWithRedirect,
		isAuthenticated,
		isLoading,
	} = useAuth0();

	// Initialize socket
	useEffect(() => {
		(async () => {
			if (!socket && user) {
				const token = await getIdTokenClaims();
				const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> =
					io(`http://localhost:8888`, {
						transports: ['websocket'],
						auth: {token: `Bearer ${token?.__raw}`},
					});
				setSocket(newSocket);
			}
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
					if (
						error.name === 'DuplicateConnection' ||
						error.name === 'UnauthorizedError'
					) {
						setPlayers([]);
						socket.disconnect();
					} else {
						setSocket(null);
					}
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
	}, [socket, user, setSocket, setPlayers]);

	if (isLoading) return 'Loading...';

	return (
		<Box w={'full'}>
			<Heading p={6} textAlign={'center'}>
				Hunted: The Game
			</Heading>
			{!socket && <Text color={'gray'}>Not connected to server</Text>}

			{!isAuthenticated && (
				<VStack>
					<Button onClick={loginWithRedirect} colorScheme={'blue'}>
						Login
					</Button>
					<Text>Not logged in</Text>;
				</VStack>
			)}
			<Profile />
			<Flex bg={'gray.700'} p={6} m={6} rounded={'xl'} flexDir={'column'}>
				<VStack justifyContent={'center'} spacing={0}>
					<Heading color={'white'}>Players</Heading>
					<Text color={'gray.200'}>{players.length} / 20</Text>
				</VStack>
				<HStack mt={4} alignItems={'stretch'}>
					<VStack bg={'red.700'} w={'full'} rounded={'lg'} p={4}>
						<Heading size={'sm'}>Hunted</Heading>
						<Wrap spacing={6}>
							{players
								.filter(u => u.type === 'hunted')
								.map(u => {
									return (
										<WrapItem key={u.id}>
											<VStack>
												<Image
													src={u.picture}
													w={16}
													h={16}
													rounded={'full'}
													referrerPolicy="no-referrer"
												/>
												<Text color={'white'}>{u.username}</Text>
											</VStack>
										</WrapItem>
									);
								})}
						</Wrap>
					</VStack>
					<VStack bg={'green.700'} w={'full'} rounded={'lg'} p={4}>
						<Heading size={'sm'}>Hunters</Heading>
						<Wrap spacing={6}>
							{players
								.filter(u => u.type === 'hunter')
								.map(u => {
									return (
										<WrapItem key={u.id}>
											<VStack>
												<Image
													src={u.picture}
													w={16}
													h={16}
													rounded={'full'}
													referrerPolicy="no-referrer"
												/>
												<Text color={'white'}>{u.username}</Text>
											</VStack>
										</WrapItem>
									);
								})}
						</Wrap>
					</VStack>
				</HStack>
			</Flex>
			<PrefButtons />
		</Box>
	);
}
