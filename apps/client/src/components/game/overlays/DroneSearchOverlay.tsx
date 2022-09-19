import {Box, theme, VStack, Text, Button, Heading} from '@chakra-ui/react';
import {EffectUseData, ServerMessages} from '@monorepo/shared';
import {useState} from 'react';
import {Circle} from 'react-leaflet';
import {Map} from '../map/Map';
import {Marker} from '../map/MapInner';

export default (props: {effect: ServerMessages['effect-active']}) => {
	const [open, setOpen] = useState(true);
	const effect = props.effect;

	return (
		<Map markers={!open}>
			<VStack zIndex={800} position="absolute" bottom={0} pb={4} w="full" justifyContent={'center'}>
				{open && (
					<Text fontSize={'xl'} color={'white'}>
						Currently viewing
					</Text>
				)}
				<Heading size={'xl'} color={'white'}>
					DRONE HEATMAP {!open && 'ACTIVE'}
				</Heading>
				<Button
					colorScheme={open ? 'red' : 'green'}
					px={8}
					fontSize={'2xl'}
					onClick={() => setOpen(prev => !prev)}
				>
					{open ? 'EXIT' : 'OPEN'}
				</Button>
			</VStack>
			<Box
				w="full"
				h="full"
				backdropFilter={open ? 'blur(50px)' : 'none'}
				position={'absolute'}
				zIndex={700}
			/>
			{open &&
				(effect.data as EffectUseData['drse']).map(({point, intensity}) => {
					return (
						<Circle
							center={point}
							key={effect.id + JSON.stringify(point)}
							radius={intensity * 10}
							color={theme.colors['orange']['400']}
							fillOpacity={1}
						/>
					);
				})}
		</Map>
	);
};
