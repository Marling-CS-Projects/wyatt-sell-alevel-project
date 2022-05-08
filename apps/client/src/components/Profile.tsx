import {useUser} from '../utils/hooks';
import {useAuth0} from '@auth0/auth0-react';
import useSWR from 'swr';

export default function Profile() {
	const {user, isAuthenticated, isLoading, logout} = useAuth0();

	if (!isAuthenticated || !user) return <div>Not logged in</div>;
	if (isLoading) return <div>Loading...</div>;

	return (
		<div>
			<img src={user.picture} alt={user.name} />
			<h2>{user.name}</h2>
			<p>{user.email}</p>
			<button onClick={() => logout({returnTo: window.location.origin})}>
				Logout
			</button>
		</div>
	);
}
export const OtherProfile = () => {
	const {data, error} = useSWR('/user');
	if (!data) return <div>Loading...</div>;
	return (
		<div>
			<pre>{JSON.stringify(data)}</pre>
		</div>
	);
};
