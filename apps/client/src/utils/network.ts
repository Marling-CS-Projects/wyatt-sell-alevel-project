import {IdToken} from '@auth0/auth0-react';
import {io, Socket} from 'socket.io-client';
import {ClientToServerEvents, ServerToClientEvents} from '@monorepo/shared/src/index';
import {toast} from 'react-hot-toast';

export async function fetcher<T>(
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
	endpoint: string,
	getToken?: () => Promise<IdToken | undefined>,
	body?: unknown
): Promise<T> {
	const token = getToken ? await getToken() : null;
	if (!token && getToken) throw new Error("User isn't logged in");

	const request = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${endpoint}`, {
		method,
		headers: {
			...(body ? {'Content-Type': 'application/json'} : {}),
			...(token ? {Authorization: `Bearer ${token.__raw}`} : {}),
		},
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include',
	});

	const json = await request.json();

	if (request.status >= 400) {
		toast.error(`${json.data}`);
		throw new Error(json.data);
	}
	return json;
}

export const connectToSocket = (
	host: string,
	token: IdToken,
	query?: Record<string, string>
): Socket<ServerToClientEvents, ClientToServerEvents> => {
	return io(`ws${process.env.NODE_ENV === 'production' ? 's' : ''}://${host}`, {
		transports: ['websocket'],
		auth: {token: `Bearer ${token.__raw}`},
		query,
	});
};
