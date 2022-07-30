import {ReactNode, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import {
	distanceFromBoundary,
	GameOptions,
	isPointInsidePolygon,
} from '@monorepo/shared/src/index';
import {toast} from 'react-hot-toast';
import {useGame, useLocation} from '../../../utils/hooks';
const MapWrapper = dynamic(() => import('./MapInner'), {ssr: false});

export const Map = (props: {
	children?: ReactNode;
	vertices?: GameOptions['vertices'];
}) => {
	const [location] = useLocation();
	const [game] = useGame();
	const [warningIds, setWarningIds] = useState<string[]>([]);

	const vertices = game?.options.vertices || props.vertices;

	useEffect(() => {
		if (location && vertices?.length) {
			const isInside = isPointInsidePolygon(
				{lat: location.latitude, lng: location.longitude},
				vertices
			);
			const distance = distanceFromBoundary(
				{lat: location.latitude, lng: location.longitude},
				vertices
			);

			if (warningIds.length) {
				warningIds.forEach(id => toast.dismiss(id));
			}

			if (!isInside) {
				const toastId = toast.error('You are not inside the game area.', {
					duration: Infinity,
				});
				setWarningIds(prev => [...prev, toastId]);
			} else {
				if (distance <= location.accuracy / 2) {
					const toastId = toast.error(
						'You are near the edge of the game area.',
						{duration: Infinity}
					);
					navigator.vibrate(100);
					setWarningIds(prev => [...prev, toastId]);
				}
			}
		}
	}, [location, vertices]);

	return <MapWrapper>{props.children}</MapWrapper>;
};
