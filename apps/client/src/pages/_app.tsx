import {AppProps} from 'next/app';
import {SWRConfig} from 'swr';
import {fetcher} from '../utils/network';
import {Auth0Provider, useAuth0} from '@auth0/auth0-react';
import {ReactNode} from 'react';
import {OtherProfile} from '../components/Profile';

const App = ({Component, pageProps}: AppProps) => {
	return (
		<Auth0Provider
			domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
			clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
			redirectUri={process.env.NEXT_PUBLIC_CLIENT_ORIGIN}
			audience={process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}
			scope={'openid profile email'}
		>
			<SWRWrapper>
				<Component {...pageProps} />
			</SWRWrapper>
		</Auth0Provider>
	);
};

const SWRWrapper = (props: {children: ReactNode}) => {
	const {getIdTokenClaims} = useAuth0();
	return (
		<SWRConfig
			value={{
				fetcher: url => fetcher('GET', url, getIdTokenClaims),
				// refreshInterval: 120 * 1000,
				// dedupingInterval: 120 * 1000,
				// errorRetryInterval: 120 * 1000,
				// focusThrottleInterval: 120 * 1000,
			}}
		>
			{props.children}
		</SWRConfig>
	);
};

export default App;