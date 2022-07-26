import {
	MapContainer,
	Popup,
	TileLayer,
	useMap,
	CircleMarker,
	Polygon,
	FeatureGroup,
	AttributionControl,
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
import {CircleMarker as LeafletCircleMarker, LatLng, Map} from 'leaflet';
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
import {ClientPlayer} from '../../../utils/types';
import {useAuth0} from '@auth0/auth0-react';
import {Button, HStack, Tag, Text} from '@chakra-ui/react';
import {TypeTag} from '../../TypeTag';
import {RiNavigationLine} from 'react-icons/ri';

export default (props: {children: ReactNode; markers?: boolean}) => {
	const [location, setLocation] = useLocation();
	const socket = useSocket();
	const [, setPlayers] = usePlayers();
	const me = useMe();
	const [game] = useGame();
	const mapRef = useRef<Map>(null);

	useEffect(() => {
		const updateLocation = (data: GeolocationPosition) => {
			setLocation(data.coords);
			if (me) {
				setPlayers(prev => [
					...prev.filter(p => p.id !== me.id),
					{...me, location: data.coords},
				]);
			}
			mapRef.current?.setView([data.coords.latitude, data.coords.longitude]);
			if (socket) {
				emitLocation(socket, data.coords);
			}
		};

		const watchId = navigator.geolocation.watchPosition(updateLocation);

		const interval = setInterval(() => {
			navigator.geolocation.getCurrentPosition(updateLocation);
		}, 500);

		return () => {
			navigator.geolocation.clearWatch(watchId);
			clearInterval(interval);
		};
	}, [socket]);

	if (!location) return null;

	return (
		<MapContainer
			center={[location.latitude, location.longitude]}
			zoom={13}
			scrollWheelZoom={true}
			style={{height: '100%', width: '100%'}}
			ref={mapRef}
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
					interactive={false}
				/>
			)}
			<div className="leaflet-bottom leaflet-right">
				{location && (
					<Button
						onClick={() =>
							mapRef.current?.flyTo(
								[location.latitude, location.longitude],
								16,
								{animate: true}
							)
						}
						m={4}
						rounded={'full'}
						style={{
							aspectRatio: '1',
						}}
						p={0}
						colorScheme={'blue'}
						pointerEvents={'all'}
					>
						<RiNavigationLine size={'1.25em'} />
					</Button>
				)}
			</div>
			{props.children}
		</MapContainer>
	);
};

const MapMarkers = (props: {location: GeolocationCoordinates}) => {
	const [players] = usePlayers();
	const {user} = useAuth0();
	const me = useMe();

	return (
		<>
			{user && (
				<PlayerMarker
					player={{
						location: props.location,
						username: user.given_name,
						type: me?.type,
					}}
					isMe
				/>
			)}
			{me &&
				players
					.filter(p => p.location && p.id !== me.id)
					.map(p => <PlayerMarker player={p} />)}
		</>
	);
};

const PlayerMarker = (props: {
	player: Partial<ClientPlayer>;
	isMe?: boolean;
}) => {
	const circleRef = useRef<LeafletCircleMarker<any>>(null);
	const map = useMap();

	const location = props.player.location;

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
				weight: (location!.accuracy / widthInMetres) * pixelBounds.x,
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
		if (location && circleRef.current) {
			circleRef.current.setLatLng([location.latitude, location.longitude]);
		}
	}, [circleRef, location]);

	if (!location) return null;

	return (
		<CircleMarker
			center={[location.latitude, location.longitude]}
			color={props.isMe ? '#4286f5' : 'red'}
			stroke
			fillColor={props.isMe ? '#4286f5' : 'red'}
			opacity={0.2}
			fillOpacity={1}
			radius={10}
			ref={circleRef}
		>
			{props.player.type && (
				<Popup
					position={[location.longitude, location.longitude]}
					closeButton={false}
				>
					<HStack>
						<Text fontSize={'20px'} m={0}>
							{props.player.username?.toUpperCase()}
						</Text>
						{props.player.type && <TypeTag type={props.player.type} />}
					</HStack>
				</Popup>
			)}
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
