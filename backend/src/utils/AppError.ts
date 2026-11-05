export type ValidationIssue = {
  field: string;
  message: string;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ValidationIssue[] | undefined;

  constructor(
    message: string,
    statusCode = 400,
    code = "BAD_REQUEST",
    details?: ValidationIssue[],
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
