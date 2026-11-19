/* Minimal structured logger. Swap for pino/winston if log shipping is needed. */
type Level = 'debug' | 'info' | 'warn' | 'error';

const write = (level: Level, message: unknown, ...meta: unknown[]) => {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${
    message instanceof Error ? message.stack ?? message.message : String(message)
  }`;
  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  out(line, ...meta);
};

export const logger = {
  debug: (msg: unknown, ...meta: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') write('debug', msg, ...meta);
  },
  info: (msg: unknown, ...meta: unknown[]) => write('info', msg, ...meta),
  warn: (msg: unknown, ...meta: unknown[]) => write('warn', msg, ...meta),
  error: (msg: unknown, ...meta: unknown[]) => write('error', msg, ...meta),
};
