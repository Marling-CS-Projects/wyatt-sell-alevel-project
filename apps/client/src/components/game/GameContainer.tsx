import {
	Avatar,
	Button,
	Flex,
	HStack,
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
import {Map} from './map/Map';
import {PlayerContainer} from '../lobby/PlayerContainer';
import Profile from '../Profile';
import {useGame, useMe} from '../../utils/hooks';
import {useEffect, useState} from 'react';
import MapPolygon from './map/MapPolygon';
import {Polygon} from 'react-leaflet';
import {TypeTag} from '../TypeTag';

export const GameContainer = () => {
	const [game] = useGame();

	if (!game) return null;

	return (
		<Flex h={'100vh'} w={'full'} flexDir={'column'}>
			<Flex h={'full'}>
				<Map />
			</Flex>
			<GameFooter />
		</Flex>
	);
};
const GameFooter = () => {
	const me = useMe();
	const [game] = useGame();
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
					<TypeTag type={me.type} />
				</VStack>
				<HStack h={'full'} justifyContent={'flex-end'}>
					<Button
						h={'full'}
						fontSize={40}
						borderColor={'red'}
						borderWidth={2}
						borderRadius={'lg'}
						style={{
							aspectRatio: '1',
						}}
					>
						🎒
					</Button>
					<Button
						h={'full'}
						fontSize={40}
						borderColor={'red'}
						borderWidth={2}
						borderRadius={'lg'}
						style={{
							aspectRatio: '1',
						}}
					>
						⚙️
					</Button>
				</HStack>
			</HStack>
		</Flex>
	);
};

const GameTime = () => {
	const [game] = useGame();
	const [time, setTime] = useState(0);

	useEffect(() => {
		const inverval = setInterval(() => {
			if (game?.startTime) {
				setTime(Math.floor((Date.now() - game.startTime) / 1000));
			}
		});
		return () => clearInterval(inverval);
	}, [game]);

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
