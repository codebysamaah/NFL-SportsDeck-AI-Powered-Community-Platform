import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function hashPassword(password) {
  return await bcrypt.hash(password, process.env.SALT_ROUNDS);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}
