import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getCollections } from "./mongodb";
import { signAuthToken, verifyAuthToken } from "./auth-jwt";

const SignUpInput = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
});

const SignInInput = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const GoogleAuthInput = z
  .object({
    credential: z.string().optional(),
    accessToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.credential || data.accessToken), {
    message: "Must provide either credential (ID Token) or accessToken",
  });

export const signUpWithEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => SignUpInput.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();
    const { users } = await getCollections();

    const existing = await users.findOne({ email });
    if (existing) {
      throw new Error("An account with this email address already exists. Please sign in.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const displayName = data.displayName?.trim() || email.split("@")[0];

    const now = new Date();
    const result = await users.insertOne({
      email,
      passwordHash,
      displayName,
      createdAt: now,
      updatedAt: now,
    });

    const userId = result.insertedId.toString();
    const token = await signAuthToken({ userId, email, displayName });

    return {
      token,
      user: {
        id: userId,
        email,
        displayName,
      },
    };
  });

export const signInWithEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => SignInInput.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase().trim();
    const { users } = await getCollections();

    const user = await users.findOne({ email });
    if (!user) {
      throw new Error("No account found with this email. Please switch to the 'Create Account' tab to register first, or Continue with Google.");
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Incorrect password. Please check your password and try again.");
    }

    const userId = user._id.toString();
    const displayName = user.displayName || email.split("@")[0];
    const token = await signAuthToken({ userId, email, displayName });

    return {
      token,
      user: {
        id: userId,
        email,
        displayName,
      },
    };
  });

export const signInWithGoogle = createServerFn({ method: "POST" })
  .validator((data: unknown) => GoogleAuthInput.parse(data))
  .handler(async ({ data }) => {
    let email: string | undefined;
    let displayName: string | undefined;
    let googleId: string | undefined;

    if (data.credential) {
      // 1. Verify Google ID Token
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(data.credential)}`,
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("[Google ID Token Error]", errText);
        throw new Error("Google credential verification failed.");
      }

      const payload = (await res.json()) as {
        email?: string;
        name?: string;
        sub?: string;
        picture?: string;
      };

      email = payload.email;
      displayName = payload.name;
      googleId = payload.sub;
    } else if (data.accessToken) {
      // 2. Verify Google Access Token via UserInfo endpoint
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[Google Access Token Error]", errText);
        throw new Error("Google access token verification failed.");
      }

      const payload = (await res.json()) as {
        email?: string;
        name?: string;
        sub?: string;
        picture?: string;
      };

      email = payload.email;
      displayName = payload.name;
      googleId = payload.sub;
    }

    if (!email) {
      throw new Error("Could not retrieve email from Google.");
    }

    email = email.toLowerCase().trim();
    displayName = displayName?.trim() || email.split("@")[0];

    const { users } = await getCollections();
    const now = new Date();

    let user = await users.findOne({ email });
    let userId: string;

    if (!user) {
      // Create new user linked with Google
      const insertRes = await users.insertOne({
        email,
        passwordHash: "", // Google OAuth user
        displayName,
        createdAt: now,
        updatedAt: now,
      });
      userId = insertRes.insertedId.toString();
    } else {
      userId = user._id.toString();
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            updatedAt: now,
            displayName: user.displayName || displayName,
          },
        },
      );
    }

    const token = await signAuthToken({ userId, email, displayName });

    return {
      token,
      user: {
        id: userId,
        email,
        displayName,
      },
    };
  });

export const verifyCurrentSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const verified = await verifyAuthToken(data.token);
    if (!verified || !verified.userId) {
      return { valid: false, user: null };
    }

    try {
      const { users } = await getCollections();
      const user = await users.findOne({ _id: new ObjectId(verified.userId) });
      if (!user) {
        return { valid: false, user: null };
      }

      return {
        valid: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
        },
      };
    } catch {
      return {
        valid: true,
        user: {
          id: verified.userId,
          email: verified.email,
          displayName: verified.displayName || verified.email.split("@")[0],
        },
      };
    }
  });
