import {Image, Text, VStack, WrapItem} from '@chakra-ui/react';
import {ServerMessages} from '@monorepo/shared/src/index';
import {useMe} from '../../utils/hooks';

export const UserIcon = (props: {u: ServerMessages['player-connected']}) => {
	const me = useMe();
	const {u} = props;

	if (!me) return null;

	return (
		<WrapItem>
			<VStack>
				<Image
					src={u.picture}
					w={20}
					h={20}
					rounded={'full'}
					referrerPolicy="no-referrer"
					border={'4px'}
					borderColor={u.id === me.id ? 'yellow.500' : 'none'}
				/>
				<Text color={'white'}>{u.username}</Text>
			</VStack>
		</WrapItem>
	);
};
