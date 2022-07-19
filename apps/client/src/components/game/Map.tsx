import {
	MapContainer,
	Marker,
	Popup,
	TileLayer,
	useMap,
	CircleMarker,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {useEffect, useRef, useState} from 'react';
import {CircleMarker as LeafletCircleMarker, LatLng} from 'leaflet';
import {useMe, usePlayers, useSocket} from '../../utils/hooks';
import {Socket} from 'socket.io-client';
import './map-lerp.css';

export default () => {
	const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
	const socket = useSocket();

	useEffect(() => {
		const watchId = navigator.geolocation.watchPosition(data => {
			console.log('watch called');
			setLocation(data.coords);
			if (socket) {
				emitLocation(socket, data.coords);
			}
		});

		const interval = setInterval(() => {
			console.log('interval called', socket);
			navigator.geolocation.getCurrentPosition(data => {
				setLocation(data.coords);
				if (socket) {
					emitLocation(socket, data.coords);
				}
			});
		}, 1000);

		return () => {
			console.log('cleared');
			clearInterval(interval);
			navigator.geolocation.clearWatch(watchId);
		};
	}, [socket]);

	if (!location || !socket) return null;

	return (
		<MapContainer
			center={[location.latitude, location.longitude]}
			zoom={13}
			scrollWheelZoom={false}
			style={{height: '100vh', width: '100%'}}
		>
			<TileLayer
				url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
				subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
				// maxNativeZoom={20}
			/>
			<MapMarkers location={location} />
		</MapContainer>
	);
};

const MapMarkers = (props: {location: GeolocationCoordinates}) => {
	const [players] = usePlayers();
	const me = useMe();

	if (!me) return null;

	return (
		<>
			<PlayerMarker location={props.location} isMe />
			{players
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
