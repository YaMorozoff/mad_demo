export class BookingError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

export class BadRequestError extends BookingError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class BookingNotFoundError extends BookingError {
  constructor(message = "This booking no longer exists.") {
    super(message, 404);
  }
}

export class BookingConflictError extends BookingError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class BookingValidationError extends BookingError {
  constructor(message: string) {
    super(message, 422);
  }
}
