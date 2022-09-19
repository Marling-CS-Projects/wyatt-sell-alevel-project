import {extendTheme} from '@chakra-ui/react';

export const theme = extendTheme({
	styles: {
		global: {
			a: {
				color: 'teal.500',
			},
		},
	},
	components: {
		Button: {
			baseStyle: {
				borderRadius: 0,
				paddingY: 8,
			},
		},
	},
	fonts: {
		body: `'Share Tech Mono', monospace`,
		heading: `'Share Tech Mono', monospace`,
		text: `'Share Tech Mono', monospace`,
	},
	config: {
		initialColorMode: 'light',
		useSystemColorMode: false,
	},
});
