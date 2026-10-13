import crypto from "node:crypto";
import jwt from "jsonwebtoken";
export function createAccessToken(user) {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error("JWT_ACCESS_SECRET is missing in backend/.env.");
  return jwt.sign({ sub: user._id.toString(), role: user.role, name: user.name }, process.env.JWT_ACCESS_SECRET, { expiresIn: `${Number(process.env.ACCESS_TOKEN_MINUTES || 15)}m` });
}
export function createRefreshToken(user) {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is missing in backend/.env.");
  return jwt.sign({ sub: user._id.toString(), type: "refresh" }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${Number(process.env.REFRESH_TOKEN_DAYS || 7)}d` });
}
export function hashToken(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
export function refreshCookieOptions() { return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/api/auth", maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 7) * 24 * 60 * 60 * 1000 }; }
export function clearRefreshCookie(res) { res.clearCookie("campusly_refresh", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/api/auth" }); }