import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return res.status(422).json({ error: issues[0]?.message || 'Invalid input', issues });
  }
  if (err.name === 'MulterError') return res.status(413).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image is larger than 6 MB.' : err.message });
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Something went wrong', details: err.details });
}

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) return next(parsed.error);
    req[source === 'body' ? 'body' : `valid${source[0].toUpperCase()}${source.slice(1)}`] = parsed.data;
    next();
  };
}
