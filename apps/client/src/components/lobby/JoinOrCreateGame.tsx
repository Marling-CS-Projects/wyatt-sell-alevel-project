import {
	Button,
	Stack,
	Link,
	Input,
	FormLabel,
	FormControl,
	Flex,
	Text,
	Box,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import {ChangeEvent, ReactChildren, ReactElement, ReactNode, useState} from 'react';
import {useGame, usePlayers, useSocket, useUser} from '../../utils/hooks';
import {socketAtom} from '../../utils/atoms';
import {useAtom} from 'jotai';
import {io, Socket} from 'socket.io-client';
import {
	ClientToServerEvents,
	GameOptions,
	Item,
	ServerMessages,
	ServerResponses,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {IdToken, useAuth0} from '@auth0/auth0-react';
import {useRouter} from 'next/router';
import {connectToSocket, fetcher} from '../../utils/network';
import {codeSchema} from '@monorepo/shared/src/schemas/connection';
import {toast} from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {Map} from '../game/map/Map';
import {emitLocation} from '../../utils/utils';

export const JoinOrCreateGame = () => {
	toast.dismiss();
	return (
		<Stack direction={['column', 'row']} justifyContent={'center'} mt={8}>
			<NextLink passHref href={'/join'}>
				<Button as={Link} colorScheme={'blue'}>
					Join
				</Button>
			</NextLink>
			<NextLink passHref href={'/create'}>
				<Button as={Link} colorScheme={'green'}>
					Create
				</Button>
			</NextLink>
		</Stack>
	);
};

export const JoinPage = () => {
	const {data: user} = useUser();
	const [code, setCode] = useState<string>('');
	const [disabled, setDisabled] = useState<boolean>(true);

	if (!user) return null;

	const handleCodeInput = (e: ChangeEvent<HTMLInputElement>) => {
		const validChars = 'abcdefghijklmnopqurstuvwxyz0123456789'.split('');
		const forcedValue = [...e.target.value]
			.filter(c => validChars.includes(c.toLowerCase()))
			.join('')
			.toLowerCase();
		const {success: isValidCode} = codeSchema.safeParse(forcedValue);

		setCode(forcedValue);
		setDisabled(isValidCode);
	};
	return (
		<Flex alignItems={'center'} flexDir={'column'}>
			<GoBackButton />
			<FormControl w={56} py={4}>
				<FormLabel htmlFor="code" fontSize={'xl'} textAlign={'center'}>
					Game code
				</FormLabel>
				<Input
					placeholder={'XXXXXX'}
					textAlign={'center'}
					fontSize={48}
					size={'xl'}
					maxLength={6}
					value={code.toUpperCase()}
					variant={'outline'}
					onChange={handleCodeInput}
					rounded={'lg'}
					id={'code'}
					type={'text'}
				/>
			</FormControl>
			<ConnectWithCode>
				{createGame => (
					<Button size={'lg'} colorScheme={'green'} onClick={() => createGame(code)}>
						Join
					</Button>
				)}
			</ConnectWithCode>
		</Flex>
	);
};

const DynamicPolygonFeature = dynamic(() => import('../game/map/MapPolygon'), {
	ssr: false,
});

export const CreatePage = () => {
	const {getIdTokenClaims} = useAuth0();
	// TBI
	const [options, setOptions] = useState<GameOptions>({
		max: {
			hunter: 10,
			hunted: 10,
		},
		vertices: [],
		duration: 0,
	});

	return (
		<Flex alignItems={'center'} flexDir={'column'}>
			<GoBackButton />
			<Box height={'72vh'} w={'full'} py={2}>
				<Map vertices={options.vertices}>
					<DynamicPolygonFeature options={options} setOptions={setOptions} />
				</Map>
			</Box>
			<Input
				placeholder={'Duration (mins)'}
				size={'lg'}
				fontSize={20}
				w={56}
				type={'number'}
				mt={4}
				boxSizing={'border-box'}
				onChange={e => setOptions(prev => ({...prev, duration: parseInt(e.target.value)}))}
			/>
			<ConnectWithCode>
				{createGame => (
					<Button
						size={'lg'}
						colorScheme={'green'}
						my={4}
						disabled={options.vertices.length === 0 || options.duration === 0}
						onClick={async () => {
							const {code} = await fetcher<ServerResponses['code']>(
								'POST',
								'/create',
								getIdTokenClaims,
								{options}
							);
							await createGame(code);
						}}
					>
						Create
					</Button>
				)}
			</ConnectWithCode>
		</Flex>
	);
};

const GoBackButton = () => (
	<Link as={NextLink} href={'/'} py={4}>
		Go back
	</Link>
);

export const ConnectWithCode = (props: {
	children(fn: (c: string) => Promise<void>): ReactElement;
}) => {
	const router = useRouter();
	const [, setGame] = useGame();
	const [, setPlayers] = usePlayers();
	const [socket, setSocket] = useAtom(socketAtom);
	const {getIdTokenClaims} = useAuth0();

	const connect = async (code: string) => {
		const token = await getIdTokenClaims();
		if (!token || socket) {
			await router.push('/');
			return;
		}
		const newSocket = connectToSocket(`localhost:8888`, token, {
			code,
		});

		const tempConnectedListener = async (game: ServerMessages['game-init']) => {
			setGame({...game, items: game.items.map(item => JSON.parse(item)) as Item[]});
			setSocket(newSocket);
			navigator.geolocation.getCurrentPosition(data => {
				emitLocation(newSocket, data.coords);
			});

			newSocket.off('game-init', tempConnectedListener);
			await router.push('/');
		};

		newSocket.on('game-init', tempConnectedListener);

		newSocket.on('connect_error', error => {
			toast.error(error.message);
			// setGame(null);
			newSocket.disconnect();
		});
	};

	return props.children(connect);
};
