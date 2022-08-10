import {ReactNode, useEffect, useState} from 'react';
import dynamic from 'next/dynamic';
import {
	distanceFromBoundary,
	GameOptions,
	isPointInsidePolygon,
} from '@monorepo/shared/src/index';
import {toast, useToasterStore} from 'react-hot-toast';
import {useGame, useLocation} from '../../../utils/hooks';
const MapWrapper = dynamic(() => import('./MapInner'), {ssr: false});

const messages = {
	outside: 'You are outside the game area',
	near: 'You are near the edge of the game area',
};

export const Map = (props: {
	children?: ReactNode;
	vertices?: GameOptions['vertices'];
}) => {
	const [location] = useLocation();
	const [game] = useGame();
	const {toasts} = useToasterStore();
	const [warningIds, setWarningIds] = useState<string[]>([]);

	const vertices = game?.options.vertices || props.vertices;

	const dismissAll = () => {
		warningIds.forEach(id => toast.dismiss(id));
		setWarningIds([]);
	};

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

			if (!isInside) {
				if (toasts.find(t => t.message === messages.outside)?.visible) return;
				dismissAll();
				const toastId = toast.error(messages.outside, {
					duration: Infinity,
				});
				setWarningIds(prev => [...prev, toastId]);
			} else {
				if (distance <= location.accuracy / 2) {
					if (toasts.find(t => t.message === messages.near)?.visible) return;
					dismissAll();
					const toastId = toast.error(messages.near, {duration: Infinity});
					navigator.vibrate(100);
					setWarningIds(prev => [...prev, toastId]);
				} else {
					if (warningIds.length) dismissAll();
				}
			}
		}
	}, [location, vertices, warningIds]);

	return <MapWrapper>{props.children}</MapWrapper>;
};
