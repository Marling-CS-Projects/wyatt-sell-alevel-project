import {useGame, useMe} from '../../utils/hooks';
import {Overlay} from '../Overlay';
import {Heading, Text} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import {socketAtom} from '../../utils/atoms';
import {useAtom} from 'jotai';

export const WinLose = () => {
	const me = useMe();
	const [game, setGame] = useGame();
	const [socket, setSocket] = useAtom(socketAtom);
	const [countdown, setCountdown] = useState(10);

	useEffect(() => {
		const interval = setInterval(() => {
			if (countdown === 0) {
				socket?.disconnect();
				setSocket(null);
				setGame(null);
			}
			setCountdown(prev => prev - 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [countdown, socket]);

	if (!game || !me || !game.hasEnded || !game.winningTeam) return null;

	const isWinner = game.winningTeam === me.type;

	return (
		<Overlay bg={isWinner ? 'rgba(81,127,218,0.8)' : 'rgba(218,81,81,0.8)'}>
			<Text fontSize={'7vw'} color={'white'}>
				{isWinner ? 'Congratulations' : 'Maybe next time'}
			</Text>
			<Heading fontSize={'15vw'} color={'white'}>
				{me.type.toUpperCase()} {isWinner ? 'WIN' : 'LOSE'}
			</Heading>
			<Text fontSize={'5vw'} color={'white'}>
				Exiting in {countdown}
			</Text>
		</Overlay>
	);
};
