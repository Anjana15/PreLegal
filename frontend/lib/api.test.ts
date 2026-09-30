import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, errorMessage } from "./api";

describe("errorMessage", () => {
  it("uses a string detail as-is", () => {
    expect(errorMessage(409, { detail: "An account with this email already exists" })).toBe(
      "An account with this email already exists",
    );
  });

  it("joins FastAPI validation issues, naming the field", () => {
    const body = {
      detail: [
        { loc: ["body", "email"], msg: "value is not a valid email address" },
        { loc: ["body", "password"], msg: "String should have at least 8 characters" },
      ],
    };
    expect(errorMessage(422, body)).toBe(
      "email: value is not a valid email address. password: String should have at least 8 characters",
    );
  });

  it("falls back to the status code for unexpected bodies", () => {
    expect(errorMessage(500, null)).toBe("Request failed (500)");
    expect(errorMessage(502, { detail: [] })).toBe("Request failed (502)");
    expect(errorMessage(400, "oops")).toBe("Request failed (400)");
  });
});

describe("api", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubFetch(response: Response) {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("posts JSON credentials to the same origin and returns the user", async () => {
    const user = { id: 1, email: "ada@example.com", created_at: "2026-09-29T00:00:00Z" };
    const fetchMock = stubFetch(Response.json(user, { status: 201 }));

    await expect(api.signUp({ email: user.email, password: "correct-horse" })).resolves.toEqual(
      user,
    );

    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/auth/signup");
    expect(init).toMatchObject({
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: "correct-horse" }),
    });
  });

  it("returns undefined for 204 responses", async () => {
    stubFetch(new Response(null, { status: 204 }));
    await expect(api.signOut()).resolves.toBeUndefined();
  });

  it("throws an ApiError carrying the status and server message", async () => {
    stubFetch(Response.json({ detail: "Not signed in" }, { status: 401 }));
    const error = await api.me().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "Not signed in" });
  });

  it("throws an ApiError when the error body isn't JSON", async () => {
    stubFetch(new Response("<html>Bad Gateway</html>", { status: 502 }));
    await expect(api.me()).rejects.toMatchObject({ status: 502, message: "Request failed (502)" });
  });
});
