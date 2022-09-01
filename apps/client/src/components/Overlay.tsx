import {Center} from '@chakra-ui/react';
import {ReactNode} from 'react';

export const Overlay = (props: {children: ReactNode; bg?: string}) => {
	return (
		<Center
			w={'100vw'}
			h={'100vh'}
			position={'absolute'}
			zIndex={10000}
			bg={props.bg || 'rgba(255,255,255,0.8)'}
			flexDir={'column'}
		>
			{props.children}
		</Center>
	);
};
