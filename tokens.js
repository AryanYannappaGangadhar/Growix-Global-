import jwt from "jsonwebtoken";
import crypto from "crypto";

export function signAuthToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAuthToken(token, secret) {
  return jwt.verify(token, secret);
}

export function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hash };
}

