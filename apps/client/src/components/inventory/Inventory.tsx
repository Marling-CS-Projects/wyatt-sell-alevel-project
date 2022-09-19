import {
	Flex,
	SimpleGrid,
	Image,
	Heading,
	VStack,
	Text,
	HStack,
	Icon,
	Spacer,
	Box,
	Button,
} from '@chakra-ui/react';
import {Item, title} from '@monorepo/shared/src/index';
import {useEffect, useState} from 'react';
import {RiArrowLeftLine, RiArrowLeftSLine, RiCloseLine, RiLayoutLeft2Line} from 'react-icons/ri';
import {useEffects, useLocation, useMe, useSocket} from 'src/utils/hooks';

export const rarityArray = {
	1: {color: 'green', text: 'common'},
	2: {color: 'orange', text: 'rare'},
	3: {color: 'pink', text: 'epic'},
} as Record<number, {color: 'green' | 'orange' | 'pink'; text: string}>;

export const itemDetails = {
	gpsj: {
		desc: 'A GPS Jammer that will disable GPS functionality for all other hunters',
		action: 'JAM GPS',
	},
	drse: {
		desc: 'A Drone that will scan the area for fugitives, and display a heatmap. Sometimes temperamental',
		action: 'DEPLOY DRONE',
	},
} as Record<Item['info']['code'], {desc: string; action: string}>;

export const Inventory = (props: {closeFn: () => void}) => {
	const me = useMe();

	console.log(me);

	const items = me?.items || [];

	return (
		<VStack
			position={'absolute'}
			w={'100%'}
			height={'100%'}
			overflowY={'scroll'}
			bg={'white'}
			zIndex={9000}
			spacing={0}
		>
			<HStack boxShadow={'lg'} w="full" zIndex={9001} p={4} justifyContent={'space-between'}>
				<Heading size={'lg'}>Inventory</Heading>
				<Icon as={RiCloseLine} w={8} h={8} onClick={props.closeFn} />
			</HStack>
			<SimpleGrid
				columns={[2, 2, 3]}
				w={'100%'}
				height={'100%'}
				overflowY={'scroll'}
				bg={'white'}
				spacing={4}
				p={4}
				pt={4}
				gridAutoRows={'1fr'}
			>
				<GridItem item={items[0]} />
				<GridItem item={items[1]} />
				<GridItem item={items[2]} />
				<GridItem item={items[3]} />
				<GridItem item={items[4]} />
				<GridItem item={items[5]} />
			</SimpleGrid>
		</VStack>
	);
};

export const GridItem = (props: {item: Item | undefined}) => {
	const item = props.item;

	const [open, setOpen] = useState(false);
	const socket = useSocket();
	const [playerLocation] = useLocation();
	const [time, setTime] = useState<number>(item ? item.info.duration * 60 : 0);
	const [, setEffects] = useEffects();

	useEffect(() => {
		if (item?.activeStart) {
			const interval = setInterval(() => {
				const newTime =
					item.info.duration * 60 - Math.floor((Date.now() - item.activeStart!) / 1000);
				setTime(newTime);
			}, 1000);

			return () => clearInterval(interval);
		}
	});

	if (!socket || !playerLocation) return null;

	if (open && item) {
		return (
			<VStack
				position={'absolute'}
				w={'100%'}
				height={'100%'}
				overflowY={'scroll'}
				bg={'white'}
				zIndex={10000}
				spacing={0}
				top={0}
				left={0}
			>
				<VStack spacing={0} p={4} w="full" pb={2}>
					<HStack w="full" justifyContent={'space-between'}>
						<Icon as={RiArrowLeftSLine} w={8} h={8} onClick={() => setOpen(false)} />
						<Heading size={'xl'}>{item.info.name}</Heading>
						<Box w={8} />
					</HStack>
					<Text color={rarityArray[item.info.rarity].color} fontSize={'lg'}>
						{title(rarityArray[item.info.rarity].text)}
					</Text>
				</VStack>
				<Image src={'https://placekitten.com/200/200'} w={'full'} />
				<VStack p={4}>
					<Text fontSize={'lg'} color="gray">
						{(itemDetails[item.info.code] || {desc: `${item.info.name} description`}).desc}
					</Text>
					<Button
						bg={item.active ? 'green.500' : 'red.500'}
						disabled={item.active}
						w="full"
						color="white"
						fontSize={'32'}
						onClick={() => {
							socket.emit('item-use', {
								id: item.id,
							});
						}}
					>
						{item.active
							? time + ' SECS'
							: (itemDetails[item.info.code] || {action: 'USE'}).action +
							  ` (${item.info.duration} MINS)`}
					</Button>
					<Button
						bg="blue.500"
						w="full"
						color="white"
						fontSize={'32'}
						onClick={() => {
							setEffects(prev => prev.filter(p => p.id !== item.id));
							socket.emit('item-drop', {
								id: item.id,
								location: {
									lat: playerLocation.latitude,
									lng: playerLocation.longitude,
								},
							});
						}}
					>
						DROP
					</Button>
				</VStack>
			</VStack>
		);
	}

	return (
		<VStack
			spacing={0}
			onClick={() => item && setOpen(true)}
			justifyContent={'center'}
			boxShadow={'0px 0px 0px 2px var(--chakra-colors-gray-200) inset'}
			bg={item && item.active ? 'green.200' : 'white'}
		>
			{item ? (
				<>
					<Image src={'https://placekitten.com/200/200'} w={'100vw'} />
					<VStack
						justifyContent={'center'}
						w={'full'}
						h="full"
						borderTop={'none'}
						spacing={0}
						p={1}
					>
						<Heading size={'md'}>{item.info.name}</Heading>
						<Text color={rarityArray[item.info.rarity].color}>
							{title(rarityArray[item.info.rarity].text)}
						</Text>
					</VStack>
				</>
			) : (
				<Text>Empty</Text>
			)}
		</VStack>
	);
};
