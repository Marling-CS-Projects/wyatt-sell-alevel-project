import {IdToken} from '@auth0/auth0-react';

export async function fetcher<T>(
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
	endpoint: string,
	getToken?: () => Promise<IdToken | undefined>,
	body?: unknown
): Promise<{data: T; code: number}> {
	const token = getToken ? await getToken() : null;
	if (!token && getToken) throw new Error("User isn't logged in");

	const request = await fetch(
		`${process.env.NEXT_PUBLIC_API_BASE}${endpoint}`,
		{
			method,
			headers: {
				...(body ? {'Content-Type': 'application/json'} : {}),
				...(token ? {Authorization: `Bearer ${token.__raw}`} : {}),
			},
			body: body ? JSON.stringify(body) : undefined,
			credentials: 'include',
		}
	);

	const json = await request.json();

	console.log('fetcher', json);

	if (request.status >= 400) {
		throw new Error(`${json.data}`);
	}
	return json;
}
