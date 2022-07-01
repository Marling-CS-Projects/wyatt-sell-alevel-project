import {
	Button,
	Stack,
	Link,
	Input,
	FormLabel,
	FormControl,
	Flex,
	Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import {
	ChangeEvent,
	ReactChildren,
	ReactElement,
	ReactNode,
	useState,
} from 'react';
import {useGame, usePlayers, useSocket, useUser} from '../../utils/hooks';
import {socketAtom} from '../../utils/atoms';
import {useAtom} from 'jotai';
import {io, Socket} from 'socket.io-client';
import {
	ClientToServerEvents,
	ServerMessages,
	ServerResponses,
	ServerToClientEvents,
} from '@monorepo/shared/src/index';
import {IdToken, useAuth0} from '@auth0/auth0-react';
import {useRouter} from 'next/router';
import {connectToSocket, fetcher} from '../../utils/network';
import {codeSchema} from '@monorepo/shared/src/schemas/connection';
import {toast} from 'react-hot-toast';

export const JoinOrCreateGame = () => {
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
					<Button
						size={'lg'}
						colorScheme={'green'}
						onClick={() => createGame(code)}
					>
						Join
					</Button>
				)}
			</ConnectWithCode>
		</Flex>
	);
};

export const CreatePage = () => {
	const {getIdTokenClaims} = useAuth0();
	const [options, setOptions] = useState({
		max: {
			hunter: 10,
			hunted: 10,
		},
	});

	return (
		<Flex alignItems={'center'} flexDir={'column'}>
			<GoBackButton />
			<Text>Settings for game setup</Text>
			<ConnectWithCode>
				{createGame => (
					<Button
						size={'lg'}
						colorScheme={'green'}
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

const ConnectWithCode = (props: {
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
			setGame(game);
			setSocket(newSocket);
			newSocket.off('game-init', tempConnectedListener);
			await router.push('/');
		};

		newSocket.on('game-init', tempConnectedListener);

		newSocket.on('connect_error', error => {
			toast.error(error.message);
			newSocket.disconnect();
		});
	};

	return props.children(connect);
};
