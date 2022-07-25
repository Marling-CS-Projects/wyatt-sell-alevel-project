import {array, number, object, string} from 'zod';

export const codeSchema = string()
	.length(6, 'Invalid code')
	.refine(v => {
		const validChars = [...'abcdefghijklmnopqurstuvwxyz0123456789'];
		return [...v].every(c => validChars.includes(c.toLowerCase()));
	})
	.transform(v => v.toLowerCase());

export const createSchema = object({
	options: object({
		max: object({
			hunter: number().gt(0),
			hunted: number().gt(0),
		}),
		vertices: array(
			object({
				lat: number().gt(-90).lt(90),
				lng: number().gt(-180).lt(180),
			})
		),
	}),
});
