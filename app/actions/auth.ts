"use server"

import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { recordLoginAttempt, isLocked } from "@/lib/login-attempts"
import bcrypt from "bcrypt"

// Match your table
interface DBUser {
  id: number;
  username: string;
  email: string;
  role: string;
  points: number;
  reserved_points: number;
  whatsapp_number: string;
  password_hash: string;
}

// ---------------- LOGIN ----------------
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const lockedFor = isLocked(email);
  if (lockedFor > 0) {
    return { success: false, message: `Too many failed attempts. Try again in ${lockedFor} seconds.` };
  }

  try {
    const users = await query<DBUser>(
      `SELECT id, username, email, role, points, reserved_points, whatsapp_number, password_hash
       FROM users 
       WHERE email = $1 
       LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      recordLoginAttempt(email, false);
      return { success: false, message: "User not found" };
    }

    const user = users[0];

    // ✅ Compare hashed password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      recordLoginAttempt(email, false);
      return { success: false, message: "Invalid password" };
    }

    recordLoginAttempt(email, true);

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points,
        reserved_points: user.reserved_points,
        whatsapp_number: user.whatsapp_number,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ---------------- CURRENT USER ----------------
export async function getCurrentUser(): Promise<DBUser | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;
    if (!userId) return null;

    const users = await query<DBUser>(
      `SELECT id, username, email, role, points, reserved_points, whatsapp_number, password_hash 
       FROM users 
       WHERE id = $1 
       LIMIT 1`,
      [Number.parseInt(userId)]
    );

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

// ---------------- REGISTER ----------------
export async function register(formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;

  try {
    const existingUsers = await query(
      `SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
      [email, username]
    );
    if (existingUsers.length > 0) {
      return { success: false, message: "User already exists" };
    }

    // ✅ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, email, password_hash, whatsapp_number, role, points, reserved_points)
       VALUES ($1, $2, $3, $4, 'customer', 0, 0)
       RETURNING id`,
      [username, email, passwordHash, whatsapp_number]
    );

    return { success: true, userId: result[0]?.id };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, message: "Failed to create user" };
  }
      }
