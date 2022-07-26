import {Tag} from '@chakra-ui/react';

export const TypeTag = (props: {type: 'hunter' | 'hunted'}) => {
	return (
		<Tag
			colorScheme={props.type === 'hunter' ? 'blue' : 'red'}
			variant={'solid'}
		>
			{props.type.toUpperCase()}
		</Tag>
	);
};
