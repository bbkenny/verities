import pino, { type Logger } from 'pino';

export const logger: Logger = pino({
  browser: { asObject: true },
  level: process.env.NEXT_PUBLIC_LOGGING_LEVEL ?? 'info',
});
