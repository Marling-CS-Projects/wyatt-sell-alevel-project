import {Button, Center, Flex, HStack, Text, VStack} from '@chakra-ui/react';
import {Map} from './map/Map';
import {useGame, useMe, useSocket} from '../../utils/hooks';
import {ReactNode, useEffect, useState} from 'react';
import {TypeTag} from '../TypeTag';
import {ConnectWithCode} from '../lobby/JoinOrCreateGame';
import {useAtom} from 'jotai';
import {socketAtom} from '../../utils/atoms';
import {CatchOverlay} from './CatchOverlay';
import {toast} from 'react-hot-toast';
import {WinLose} from './WinLose';

export const GameContainer = () => {
	const [game, setGame] = useGame();
	const socket = useSocket();
	const me = useMe();

	if (!game) return null;
	if (!socket)
		return (
			<Center h={'100vh'}>
				<ConnectWithCode>
					{connect => (
						<VStack spacing={4}>
							<Button onClick={async () => await connect(game.code)}>Reconnect</Button>
							<Button
								colorScheme={'red'}
								onClick={() => {
									setGame(null);
								}}
							>
								Leave Game
							</Button>
						</VStack>
					)}
				</ConnectWithCode>
			</Center>
		);

	return (
		<Flex h={'100vh'} w={'full'} flexDir={'column'}>
			<Flex h={'full'}>
				{me?.catching && <CatchOverlay />}
				{game.hasEnded && <WinLose />}
				<Map />
			</Flex>
			<GameFooter />
		</Flex>
	);
};
const GameFooter = () => {
	const me = useMe();
	const [game, setGame] = useGame();
	const [socket, setSocket] = useAtom(socketAtom);
	if (!me || !game) return null;

	return (
		<Flex p={4}>
			<HStack justifyContent={'space-between'} w={'full'}>
				<VStack flexDir={'column'} spacing={2} alignItems={'flex-start'}>
					<HStack spacing={2} alignItems={'center'}>
						<Text fontSize={24} fontWeight={'800'} lineHeight={'24px'}>
							{me.username.toUpperCase()}
						</Text>
						<GameTime />
					</HStack>
					<HStack>
						<TypeTag type={me.type} />
						<Text
							color={'red'}
							onClick={() => {
								socket?.disconnect();
								setSocket(null);
								setGame(null);
							}}
							cursor={'pointer'}
						>
							Leave Game
						</Text>
					</HStack>
				</VStack>
				<HStack h={'full'} justifyContent={'flex-end'}>
					<FooterButton>🎒</FooterButton>
					<FooterButton>⚙️</FooterButton>
				</HStack>
			</HStack>
		</Flex>
	);
};

const GameTime = () => {
	const [game] = useGame();
	const [time, setTime] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			if (game?.startTime) {
				const newTime =
					game.options.duration * 60 - Math.floor((Date.now() - game.startTime) / 1000);
				if (newTime === 10 * 60) toast('10 minutes left!', {duration: 5000, icon: 'ℹ️'});
				if (newTime === 5 * 60) toast('5 minutes left!', {duration: 5000, icon: 'ℹ️'});
				if (newTime === 60) toast('1 minute left!', {duration: 5000, icon: 'ℹ️'});

				setTime(newTime);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [game, time]);

	if (!game) return null;

	return (
		<Text>
			{Math.floor(time / 60)
				.toString()
				.padStart(2, '0')}
			:{(time % 60).toString().padStart(2, '0')}
		</Text>
	);
};

const FooterButton = (props: {children: ReactNode}) => {
	return (
		<Button
			h={'full'}
			fontSize={40}
			borderColor={'red'}
			borderWidth={2}
			borderRadius={'lg'}
			py={'unset'}
			style={{
				aspectRatio: '1',
			}}
		>
			{props.children}
		</Button>
	);
};
