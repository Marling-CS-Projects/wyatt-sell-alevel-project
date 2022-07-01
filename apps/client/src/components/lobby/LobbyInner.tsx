import Profile from '../Profile';
import {Button, Flex, Heading, Text, VStack} from '@chakra-ui/react';
import {PlayerContainer} from './PlayerContainer';
import {PrefButtons} from '../PrefButtons';
import {ServerMessages, ServerToClientEvents} from '@monorepo/shared/src/index';
import {useGame, useMe, usePlayers} from '../../utils/hooks';
import {JoinOrCreateGame} from './JoinOrCreateGame';
import {StartGame} from './StartGame';

export const LobbyInner = () => {
	const [players] = usePlayers();
	const [game] = useGame();
	const me = useMe();
	if (!game || !me) return null;
	return (
		<Flex w={'full'} justifyContent={'center'} flexDir={'column'}>
			<Heading size={'2xl'} textAlign={'center'} pt={12} pb={4}>
				{game.code.toUpperCase()}
			</Heading>
			<Flex bg={'gray.700'} p={6} m={6} rounded={'xl'} flexDir={'column'}>
				<VStack justifyContent={'center'} spacing={0}>
					<Heading color={'white'}>Players</Heading>
					<Text color={'gray.200'}>{players.length} / 20</Text>
				</VStack>
				<PlayerContainer />
				<PrefButtons />
			</Flex>
			{me.isHost && <StartGame />}
		</Flex>
	);
};
