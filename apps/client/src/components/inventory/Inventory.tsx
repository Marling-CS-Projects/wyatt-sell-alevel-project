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
import {useState} from 'react';
import {RiArrowLeftLine, RiArrowLeftSLine, RiCloseLine, RiLayoutLeft2Line} from 'react-icons/ri';
import {useLocation, useMe, useSocket} from 'src/utils/hooks';

export const rarityArray = {
	1: {color: 'green', text: 'common'},
	2: {color: 'orange', text: 'rare'},
	3: {color: 'pink', text: 'epic'},
} as Record<number, {color: 'green' | 'orange' | 'pink'; text: string}>;

export const itemDetails = {
	gpsj: {
		desc: 'A GPS Jammer that will disable GPS functionality for all other hunters. Lasts 5 minutes',
		action: 'JAM GPS',
	},
} as Record<Item['info']['code'], {desc: string; action: string}>;

export const Inventory = (props: {closeFn: () => void}) => {
	const me = useMe();

	if (!me?.items) return null;

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
				<GridItem item={me.items[0]} />
				<GridItem item={me.items[1]} />
				<GridItem item={me.items[2]} />
				<GridItem item={me.items[3]} />
				<GridItem item={me.items[4]} />
				<GridItem item={me.items[5]} />
			</SimpleGrid>
		</VStack>
	);
};

export const GridItem = (props: {item: Item | undefined}) => {
	const [open, setOpen] = useState(false);
	const socket = useSocket();
	const [playerLocation] = useLocation();

	const item = props.item;

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
					<Button bg="red.500" w="full" color="white" fontSize={'32'}>
						{(itemDetails[item.info.code] || {action: 'USE'}).action}
					</Button>
					<Button
						bg="blue.500"
						w="full"
						color="white"
						fontSize={'32'}
						onClick={() =>
							socket.emit('item-drop', {
								id: item.id,
								location: {
									lat: playerLocation.latitude,
									lng: playerLocation.longitude,
								},
							})
						}
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
		>
			{item ? (
				<>
					<Image src={'https://placekitten.com/200/200'} />
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
