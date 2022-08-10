import {Socket} from 'socket.io-client';

export const getCookie = (name: string) =>
	document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop();

export const emitLocation = (socket: Socket, data: GeolocationCoordinates) => {
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
