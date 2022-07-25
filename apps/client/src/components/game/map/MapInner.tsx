import {
	MapContainer,
	Popup,
	TileLayer,
	useMap,
	CircleMarker,
	Polygon,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {CircleMarker as LeafletCircleMarker, LatLng} from 'leaflet';
import {
	useGame,
	useLocation,
	useMe,
	usePlayers,
	useSocket,
} from '../../../utils/hooks';
import {Socket} from 'socket.io-client';
import {GameOptions, isPointInsidePolygon} from '@monorepo/shared/src/index';
import {toast} from 'react-hot-toast';

export default (props: {children: ReactNode; markers?: boolean}) => {
	const [location, setLocation] = useLocation();
	const socket = useSocket();
	const [game] = useGame();

	useEffect(() => {
		const watchId = navigator.geolocation.watchPosition(data => {
			if (socket) {
				emitLocation(socket, data.coords);
			}
			if (
				data.coords.latitude === location?.latitude &&
				data.coords.longitude === location?.longitude
			) {
				return;
			}
			setLocation(data.coords);
		});

		const interval = setInterval(() => {
			navigator.geolocation.getCurrentPosition(data => {
				if (socket) {
					emitLocation(socket, data.coords);
				}
				if (
					data.coords.latitude === location?.latitude &&
					data.coords.longitude === location?.longitude
				) {
					return;
				}
				setLocation(data.coords);
			});
		}, 500);

		return () => {
			navigator.geolocation.clearWatch(watchId);
			clearInterval(interval);
		};
	}, [socket, location]);

	if (!location) return null;

	return (
		<MapContainer
			center={[location.latitude, location.longitude]}
			zoom={13}
			scrollWheelZoom={true}
			style={{height: '100%', width: '100%'}}
		>
			<TileLayer
				url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
				subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
			/>
			{props.markers !== false && <MapMarkers location={location} />}
			{game?.hasStarted && (
				<Polygon
					pathOptions={{stroke: true, color: 'red', fillOpacity: 0}}
					positions={game.options.vertices}
				/>
			)}
			{props.children}
		</MapContainer>
	);
};

const MapMarkers = (props: {location: GeolocationCoordinates}) => {
	const [players] = usePlayers();
	const me = useMe();

	return (
		<>
			<PlayerMarker location={props.location} isMe />
			{me &&
				players
					.filter(p => p.location && p.id !== me.id)
					.map(({location}) => (
						<PlayerMarker location={location!} isMe={false} />
					))}
		</>
	);
};

const PlayerMarker = (props: {
	location: GeolocationCoordinates;
	isMe: boolean;
}) => {
	const circleRef = useRef<LeafletCircleMarker<any>>(null);
	const map = useMap();

	const mapZoomListener = () => {
		const bounds = map.getBounds();
		const pixelBounds = map.getSize();
		const {lat} = bounds.getCenter();

		const widthInMetres = new LatLng(lat, bounds.getWest()).distanceTo({
			lat,
			lng: bounds.getEast(),
		});
		if (circleRef.current) {
			circleRef.current.setStyle({
				weight: (props.location.accuracy / widthInMetres) * pixelBounds.x,
			});
		}
	};

	useEffect(() => {
		map.on('load', mapZoomListener);
		map.on('zoom', mapZoomListener);
		return () => {
			map.off('load', mapZoomListener);
			map.off('zoom', mapZoomListener);
		};
	}, [circleRef, map]);

	useEffect(() => {
		if (props.location && circleRef.current) {
			circleRef.current.setLatLng([
				props.location.latitude,
				props.location.longitude,
			]);
		}
	}, [circleRef, props.location]);

	return (
		<CircleMarker
			center={[props.location.latitude, props.location.longitude]}
			color={props.isMe ? '#4286f5' : 'red'}
			stroke
			fillColor={props.isMe ? '#4286f5' : 'red'}
			opacity={0.2}
			fillOpacity={1}
			radius={10}
			ref={circleRef}
		>
			<Popup>
				A pretty CSS3 popup. <br /> Easily customizable.
			</Popup>
		</CircleMarker>
	);
};

const emitLocation = (socket: Socket, data: GeolocationCoordinates) => {
	socket.emit('player-location', {
		accuracy: data.accuracy,
		altitude: data.altitude,
		altitudeAccuracy: data.altitudeAccuracy,
		heading: data.heading,
		latitude: data.latitude,
		longitude: data.longitude,
		speed: data.speed,
	});
};
