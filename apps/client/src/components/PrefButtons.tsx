import {useMe, usePlayers, useSocket} from '../utils/hooks';
import {Button, ButtonGroup, VStack} from '@chakra-ui/react';

export const PrefButtons = () => {
	const socket = useSocket();
	const [players] = usePlayers();
	const me = useMe();

	if (!socket || !me) return null;

	return (
		<VStack justifyContent={'center'}>
			<Button
				colorScheme="blue"
				my={4}
				onClick={() =>
					socket.emit('player-pref', me.type === 'hunted' ? 'hunter' : 'hunted')
				}
				// TODO: Replace with game settings
				disabled={players.filter(p => p.type === 'hunted').length >= 10}
			>
				Switch role
			</Button>
		</VStack>
	);
};
