import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generates a random 6-digit numeric OTP
 */
export function generateOtp(): string {
  // Use crypto.randomInt for secure random generation (range: 100000 - 999999)
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP using bcrypt
 */
export async function hashOtp(code: string): Promise<string> {
  // 12 rounds is standard for bcrypt
  return bcrypt.hash(code, 12);
}

/**
 * Compares a raw OTP against a hashed OTP
 */
export async function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
