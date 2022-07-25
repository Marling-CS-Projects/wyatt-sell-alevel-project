import {ReactNode, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import {
	GameOptions,
	isNearPolygonEdge,
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
	const [warningId, setWarningId] = useState<string | undefined>();

	const vertices = game?.options.vertices || props.vertices;

	useEffect(() => {
		console.log('useeffect', location, vertices);
		if (location && vertices?.length) {
			const isInside = isPointInsidePolygon(
				{lat: location.latitude, lng: location.longitude},
				vertices
			);
			const isNear = isNearPolygonEdge(
				{lat: location.latitude, lng: location.longitude},
				vertices
			);
			console.log(isNear);

			if (!isInside) {
				const toastId = toast.error('You are not inside the game area.', {
					duration: Infinity,
				});
				setWarningId(toastId);
			} else {
				if (warningId) {
					toast.dismiss(warningId);
				}
			}
		}
	}, [location, vertices]);

	return <MapWrapper>{props.children}</MapWrapper>;
};
