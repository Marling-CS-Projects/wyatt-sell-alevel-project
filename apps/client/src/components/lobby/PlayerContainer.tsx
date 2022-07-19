import {Button, Heading, Stack, VStack, Wrap} from '@chakra-ui/react';
import {UserIcon} from './UserIcon';
import {ServerMessages} from '@monorepo/shared/src/index';
import {usePlayers} from '../../utils/hooks';

export const PlayerContainer = () => {
	const [players] = usePlayers();
	return (
		<Stack
			mt={4}
			alignItems={'stretch'}
			direction={['column', 'column', 'row']}
			spacing={4}
			pos={'relative'}
		>
			<PlayerClassContainer
				bg={'red.700'}
				players={players.filter(u => u.type === 'hunted')}
				title={'Hunted'}
			/>
			<PlayerClassContainer
				bg={'blue.700'}
				players={players.filter(u => u.type === 'hunter')}
				title={'Hunters'}
			/>
		</Stack>
	);
};

const PlayerClassContainer = (props: {
	players: ServerMessages['player-connected'][];
	title: string;
	bg: string;
}) => {
	return (
		<VStack bg={props.bg} w={'full'} rounded={'lg'} p={4}>
			<Heading size={'sm'}>{props.title}</Heading>
			<Wrap spacing={6}>
				{props.players.map(u => (
					<UserIcon u={u} key={u.id} />
				))}
			</Wrap>
		</VStack>
	);
};
