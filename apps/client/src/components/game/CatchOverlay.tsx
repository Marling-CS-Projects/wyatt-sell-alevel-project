import {Button, Center, VStack, Text} from '@chakra-ui/react';
import {useMe, useSocket} from '../../utils/hooks';
import {Overlay} from '../Overlay';

export const CatchOverlay = () => {
	const me = useMe();
	const socket = useSocket();

	if (!me?.catching || !socket) return null;

	return (
		<Overlay>
			<Button
				w={'80vw'}
				h={'unset'}
				maxW={'600px'}
				maxH={'600px'}
				color={'white'}
				bg={'red'}
				fontSize={'10vw'}
				borderRadius={'full'}
				style={{
					aspectRatio: '1',
				}}
				_hover={{
					bg: 'red.600',
				}}
				onClick={() => {
					socket.emit('player-catch', {id: me.catching!.id});
				}}
			>
				CATCH
			</Button>
			<VStack pt={4} spacing={0}>
				<Text fontSize={'5vw'}>Targeting:</Text>
				<Text fontSize={'8vw'}>{me.catching!.username}</Text>
			</VStack>
		</Overlay>
	);
};
