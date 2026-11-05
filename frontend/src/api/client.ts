import type {
  ApiErrorBody,
  ApiErrorDetail,
  ApiErrorResponse,
} from "../types/api";

const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (
  configuredBaseUrl && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : "http://localhost:4000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(
    message: string,
    status: number,
    code: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorDetail(value: unknown): value is ApiErrorDetail {
  return (
    isRecord(value) &&
    typeof value.field === "string" &&
    typeof value.message === "string"
  );
}

function readErrorBody(payload: unknown): ApiErrorResponse["error"] | null {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null;
  }

  const error = payload.error;

  if (typeof error.code !== "string" || typeof error.message !== "string") {
    return null;
  }

  const details = Array.isArray(error.details)
    ? error.details.filter(isErrorDetail)
    : [];

  return {
    code: error.code,
    message: error.message,
    details,
  };
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = error.details[0];

    return detail === undefined ? error.message : detail.message;
  }

  return "Something went wrong. Please try again.";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError(
      "Unable to reach the SpendWise API. Check that the backend is running.",
      0,
      "NETWORK_ERROR",
    );
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const errorBody: ApiErrorBody | null = readErrorBody(payload);

    throw new ApiError(
      errorBody?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      errorBody?.code ?? "REQUEST_FAILED",
      errorBody?.details ?? [],
    );
  }

  return payload as T;
}
