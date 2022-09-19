import {Box, propNames} from '@chakra-ui/react';
import {useEffects} from 'src/utils/hooks';
import {useGlitch} from 'react-powerglitch';
import {ReactNode} from 'react';
import {Map} from './map/Map';
import dynamic from 'next/dynamic';
const DroneSearchOverlay = dynamic(() => import('./overlays/DroneSearchOverlay'), {ssr: false});

export const EffectsOverlay = () => {
	const [effects] = useEffects();

	const codesMap = effects.map(e => e.code);

	switch (true) {
		case codesMap.includes('gpsj'):
			return <GPSOverlay />;
		case codesMap.includes('drse'):
			return <DroneSearchOverlay effect={effects.find(e => e.code === 'drse')!} />;
		case codesMap.includes('drsehunted'):
			return (
				<>
					<audio loop={true} autoPlay={true}>
						<source src={'drone-buzz.mp3'} type={'audio/mpeg'} />
					</audio>
					<Map />
				</>
			);
		default:
			return <Map />;
	}
};

const GPSOverlay = () => {
	const glitch = useGlitch({
		hideOverflow: false,
		glitchTimeSpan: {
			start: 0,
			end: 600,
		},
		slice: {hueRotate: true},
		timing: {duration: 1000},
	});
	return (
		<Box
			ref={glitch.ref}
			position={'absolute'}
			w={'100%'}
			height={'100%'}
			bg="black"
			zIndex={8000}
			maxW={'100vw'}
			overflow={'hidden'}
		>
			<Map />
		</Box>
	);
};
