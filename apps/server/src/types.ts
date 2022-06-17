export type envType = {
	REDIS_URL: string;
	DATABASE_URL: string;
	CLIENT_ORIGIN: string;
};

export type userType = {
	given_name: string;
	family_name: string;
	nickname: string;
	name: string;
	picture: string;
	locale: string;
	updated_at: string;
	email: string;
	email_verified: boolean;
	iss: string;
	sub: string;
	aud: string;
	iat: number;
	exp: number;
	nonce: string;
};
