import 'server-only';

/** Thrown by repositories/services when an entity does not exist. Routes map it to 404. */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Thrown for caller/validation errors. Routes map it to 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
