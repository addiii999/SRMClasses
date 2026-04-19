const isProduction = process.env.NODE_ENV === 'production';

const write = (level, message, meta = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (isProduction) {
    // Structured logs are easier to ingest into observability platforms.
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }

  const details = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  process.stdout.write(`[${payload.ts}] ${level.toUpperCase()} ${message}${details}\n`);
};

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
