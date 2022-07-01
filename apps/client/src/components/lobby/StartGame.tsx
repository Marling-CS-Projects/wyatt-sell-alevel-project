import {Button} from '@chakra-ui/react';
import {useSocket} from '../../utils/hooks';

export const StartGame = () => {
	const socket = useSocket();

	if (!socket) return null;

	const start = () => {
		socket.emit('game-start', true);
	};

	return (
		<Button
			onClick={start}
			w={'min'}
			alignSelf={'center'}
			colorScheme={'green'}
		>
			Start Game
		</Button>
	);
};
