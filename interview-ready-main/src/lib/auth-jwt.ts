import { SignJWT, jwtVerify } from "jose";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "ncs_interview_ready_jwt_secret_2026_super_secure_key";
const key = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  email: string;
  displayName?: string;
}

export async function signAuthToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

export async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    if (!payload || typeof payload !== "object") return null;
    return {
      userId: (payload["userId"] as string) || (payload.sub as string),
      email: payload["email"] as string,
      displayName: payload["displayName"] as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Client-side function middleware to automatically attach the stored JWT Bearer token
 * to every server function request.
 */
export const attachMongoAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | null = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("AUTH_TOKEN");
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

/**
 * Server-side function middleware requiring a valid Bearer JWT.
 * Exposes userId, email, and displayName on the context.
 */
export const requireMongoAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Please sign in to continue");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      throw new Error("Unauthorized: Missing authentication token");
    }

    const verified = await verifyAuthToken(token);
    if (!verified || !verified.userId) {
      throw new Error("Unauthorized: Session expired or invalid token");
    }

    return next({
      context: {
        userId: verified.userId,
        email: verified.email,
        displayName: verified.displayName,
      },
    });
  },
);
