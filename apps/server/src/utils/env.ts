export const validate = (key: string) => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable ${key} is not set`);
	}
	return value;
};

export const env = {
	PORT: parseInt(validate('PORT')),
	REDIS_URL: validate('REDIS_URL'),
	CLIENT_ORIGIN: validate('CLIENT_ORIGIN'),
	DATABAE_URL: validate('DATABASE_URL'),
	AUTH0_AUDIENCE: validate('AUTH0_SECRET'),
	AUTH0_DOMAIN: validate('AUTH0_DOMAIN'),
	AUTH0_SECRET: validate('AUTH0_SECRET'),
};
