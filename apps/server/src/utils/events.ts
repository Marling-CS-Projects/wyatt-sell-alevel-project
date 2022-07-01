// import {Socket} from 'socket.io';
// import {ServerMessages, ServerToClientEvents} from '@monorepo/shared/src/index';
//
// export const events = (socket: Socket, type: keyof ServerMessages) => {
// 	const eventsMap: Partial<{
// 		[key in keyof ServerMessages]: () => ServerMessages[key];
// 	}> = {
// 		'user-connected': () => {
// 			const {socket: playerSocket, game, user, ...safePlayer} = socket.player;
// 			return {
// 				username: socket.user.given_name,
// 				picture: socket.user.picture,
// 				...safePlayer,
// 			};
// 		},
// 	};
//
// 	if (!(type in eventsMap)) throw new Error('Type not in events');
// 	return eventsMap[type]!();
// };
