/** Typed client for the FastAPI backend. Paths are same-origin in both dev and production. */

export type User = { id: number; email: string; created_at: string };
export type Credentials = { email: string; password: string };

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ValidationIssue = { loc?: (string | number)[]; msg?: string };

/** Turns a FastAPI error body (`{detail: string}` or a list of validation issues) into a sentence. */
export function errorMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = (detail as ValidationIssue[])
      .map(({ loc, msg }) => {
        const field = loc?.at(-1);
        return msg && (typeof field === "string" ? `${field}: ${msg}` : msg);
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join(". ");
  }
  return `Request failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(errorMessage(response.status, body), response.status);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  me: () => request<User>("/api/auth/me"),
  signUp: (credentials: Credentials) => post<User>("/api/auth/signup", credentials),
  signIn: (credentials: Credentials) => post<User>("/api/auth/signin", credentials),
  signOut: () => post<void>("/api/auth/signout"),
};
