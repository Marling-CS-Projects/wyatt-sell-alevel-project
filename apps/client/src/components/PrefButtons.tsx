import {usePlayers, useSocket} from '../utils/hooks';
import {Button, ButtonGroup, VStack} from '@chakra-ui/react';

export const PrefButtons = () => {
	const socket = useSocket();
	const [players] = usePlayers();

	if (!socket) return null;

	return (
		<VStack justifyContent={'center'}>
			<ButtonGroup rounded={'lg'}>
				<Button
					colorScheme="red"
					onClick={() => socket.emit('player-pref', 'hunted')}
					disabled={players.filter(p => p.type === 'hunted').length >= 10}
				>
					Hunted
				</Button>
				<Button
					colorScheme="green"
					onClick={() => socket.emit('player-pref', 'hunter')}
					disabled={players.filter(p => p.type === 'hunter').length >= 10}
				>
					Hunter
				</Button>
			</ButtonGroup>
		</VStack>
	);
};
