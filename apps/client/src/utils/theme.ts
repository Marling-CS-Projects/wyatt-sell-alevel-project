import {extendTheme} from '@chakra-ui/react';

export const theme = extendTheme({
	styles: {
		global: {
			// 'html, body': {
			// 	bg: 'gray.800',
			// 	color: 'white',
			// },
			a: {
				color: 'teal.500',
			},
		},
	},
	config: {
		initialColorMode: 'light',
		useSystemColorMode: false,
	},
});
