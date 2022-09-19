import {
	MapContainer,
	Popup,
	TileLayer,
	useMap,
	CircleMarker,
	Polygon,
	FeatureGroup,
	AttributionControl,
	Tooltip,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CircleMarker as LeafletCircleMarker, LatLng, Map} from 'leaflet';
import {useGame, useLocation, useMe, usePlayers, useSocket} from '../../../utils/hooks';
import {Socket} from 'socket.io-client';
import {
	GameOptions,
	getBoxPoints,
	isPointInsidePolygon,
	Item,
	Player,
} from '@monorepo/shared/src/index';
import {toast} from 'react-hot-toast';
import {useAuth0} from '@auth0/auth0-react';
import {Button, HStack, Tag, Text, theme, VStack, Flex, propNames} from '@chakra-ui/react';
import {TypeTag} from '../../TypeTag';
import {RiNavigationLine} from 'react-icons/ri';
import {debounce} from 'lodash';
import {emitLocation} from '../../../utils/utils';
import {distance} from '@monorepo/shared/src/utils/haversine';
import {rarityArray} from 'src/components/inventory/Inventory';

export default (props: {children: ReactNode; markers?: boolean}) => {
	const [location, setLocation] = useLocation();
	const socket = useSocket();
	const [, setPlayers] = usePlayers();
	const me = useMe();
	const [game] = useGame();
	const mapRef = useRef<Map>(null);
	const items = useGame()[0]?.items;

	const updateLocation = (data: GeolocationPosition) => {
		if (
			location?.longitude !== data.coords.longitude ||
			location?.latitude !== data.coords.latitude
		) {
			if (socket) {
				emitLocation(socket, data.coords);
			}
			setLocation(data.coords);
			if (me) {
				setPlayers(prev => [...prev.filter(p => p.id !== me.id), {...me, location: data.coords}]);
			}
			mapRef.current?.setView([data.coords.latitude, data.coords.longitude]);
		}
	};

	useEffect(() => {
		//const watchId = navigator.geolocation.watchPosition(updateLocation);
		const interval = setInterval(() => {
			navigator.geolocation.getCurrentPosition(updateLocation);
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [socket, location, me]);

	if (!location) return null;

	const pickableItem = items?.find(i => distance(i.location, location) < 100);

	return (
		<MapContainer
			center={[location.latitude, location.longitude]}
			zoom={13}
			scrollWheelZoom={true}
			style={{height: '100%', width: '100%'}}
			ref={mapRef}
		>
			{props.children}
			<TileLayer
				url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
				subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
				updateWhenZooming={false}
			/>
			{props.markers !== false && (
				<>
					<PlayerMarkers location={location} />
					{items && <ItemMarkers items={items} location={location} />}
				</>
			)}
			{game?.hasStarted && (
				<>
					<Polygon
						pathOptions={{stroke: true, color: 'red', fillOpacity: 0}}
						positions={game.options.vertices}
						interactive={false}
					/>
				</>
			)}
			<div className="leaflet-bottom leaflet-right">
				{location && (
					<Button
						onClick={() =>
							mapRef.current?.flyTo([location.latitude, location.longitude], 16, {animate: true})
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
			<Flex className="leaflet-bottom" justifyContent={'center'} w={'full'}>
				{location && pickableItem && (
					<Button
						onClick={() => {
							if (me?.items?.length === 6) {
								toast.error('Inventory full');
							} else {
								socket?.emit('item-pickup', {id: pickableItem.id});
							}
						}}
						m={4}
						rounded={'lg'}
						colorScheme={me?.items?.length === 6 ? 'red' : 'green'}
						pointerEvents={'all'}
						px={8}
						py={2}
						size={'lg'}
						css={{
							fontFamily: `'Share Tech Mono', monospace !important`,
						}}
					>
						Pick up
					</Button>
				)}
			</Flex>
		</MapContainer>
	);
};

export const ItemMarkers = memo(
	(props: {items: Item[]; location: GeolocationCoordinates}) => {
		const {items, location} = props;

		if (!items || !location) return null;

		return (
			<>
				{items.map(item => {
					const baseColor = rarityArray[item.info.rarity].color;
					return (
						<Marker
							location={{
								latitude: item.location.lat,
								longitude: item.location.lng,
							}}
							key={item.id}
							size={15}
							color={theme.colors[baseColor]['300']}
							overlay={
								<Tooltip
									permanent={true}
									direction={'center'}
									position={[item.location.lat, item.location.lng]}
									className={'item-tooltip'}
								>
									<Text color={`${baseColor}.700`} fontSize={20} fontWeight={700}>
										{item.info.code[0].toUpperCase()}
									</Text>
								</Tooltip>
							}
						>
							<VStack>
								<Text fontSize={'20px'} m={0} fontWeight={'bold'}>
									{item.info.name}
								</Text>
								<HStack>
									<Text color={`${baseColor}.700`} fontSize={16} pr={4} fontWeight={'bold'}>
										{rarityArray[item.info.rarity].text.toUpperCase()}
									</Text>
									<Text fontSize={16} fontWeight={'bold'} color={'gray.700'}>
										{Math.floor(
											distance(item.location, {
												lat: location.latitude,
												lng: location.longitude,
											})
										)}
										m
									</Text>
								</HStack>
							</VStack>
						</Marker>
					);
				})}
			</>
		);
	},
	(prev, next) => {
		return (
			prev.items.length === next.items.length &&
			prev.location.latitude === next.location.latitude &&
			prev.location.longitude === next.location.longitude
		);
	}
);

const PlayerMarkers = (props: {location: GeolocationCoordinates}) => {
	const [players] = usePlayers();
	const {user} = useAuth0();
	const me = useMe();

	return (
		<>
			{user && (
				<Marker location={props.location} isMe>
					<PlayerPopupContents
						player={{
							username: user.given_name,
							type: me?.type,
						}}
					/>
				</Marker>
			)}
			{me &&
				players
					.filter(p => p.location && p.id !== me.id)
					.map(p => (
						<Marker location={p.location!} key={p.id}>
							<PlayerPopupContents player={p} />
						</Marker>
					))}
		</>
	);
};

const PlayerPopupContents = (props: {player: Partial<Player>}) => {
	const p = props.player;

	if (!p.type) return null;
	return (
		<HStack>
			<Text fontSize={'20px'} m={0}>
				{p.username?.toUpperCase()}
			</Text>
			{p.type && <TypeTag type={p.type} />}
		</HStack>
	);
};

export const Marker = (props: {
	location: {latitude: number; longitude: number} & Partial<GeolocationCoordinates>;
	isMe?: boolean;
	size?: number;
	color?: string;
	overlay?: ReactNode;
	zoomAdjust?: boolean;
	children: ReactNode;
}) => {
	const circleRef = useRef<LeafletCircleMarker<any>>(null);
	const map = useMap();

	const location = props.location;

	const mapZoomListener = () => {
		if (map.getZoom() < 16) return;
		const bounds = map.getBounds();
		const pixelBounds = map.getSize();
		const {lat} = bounds.getCenter();

		const widthInMetres = new LatLng(lat, bounds.getWest()).distanceTo({
			lat,
			lng: bounds.getEast(),
		});
		if (circleRef.current && location.accuracy) {
			circleRef.current.setStyle({
				weight: (location.accuracy / widthInMetres) * pixelBounds.x,
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
		<>
			<CircleMarker
				center={[location.latitude, location.longitude]}
				color={props.isMe ? '#4286f5' : props.color || 'red'}
				stroke
				fillColor={props.isMe ? '#4286f5' : props.color || 'red'}
				opacity={0.2}
				fillOpacity={1}
				radius={props.size || 10}
				ref={circleRef}
			>
				{props.overlay}
				{props.children && (
					<Popup position={[location.latitude, location.longitude]} closeButton={false}>
						{props.children}
					</Popup>
				)}
			</CircleMarker>
		</>
	);
};
