import {Button} from '@chakra-ui/react';
import {useGame, useSocket} from '../../utils/hooks';
import {fetcher} from '../../utils/network';
import {useAuth0} from '@auth0/auth0-react';
import {toast} from 'react-hot-toast';

export const StartGame = () => {
	const socket = useSocket();
	const {getIdTokenClaims} = useAuth0();
	const [game, setGame] = useGame();

	if (!socket) return null;

	const start = async () => {
		const res = await toast
			.promise(fetcher<{code: number}>('POST', '/start', getIdTokenClaims), {
				success: 'Game started',
				error: 'Game failed to start',
				loading: 'Starting game',
			})
			.then(() => {
				setGame(g => ({...g!, hasStarted: true}));
			});
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
