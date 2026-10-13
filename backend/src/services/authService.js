import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken, hashToken, refreshCookieOptions } from "../utils/tokens.js";

export function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
  };
}

export async function issueSession(user, res) {
  const refreshToken = createRefreshToken(user);
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  res.cookie("campusly_refresh", refreshToken, refreshCookieOptions());
  return { accessToken: createAccessToken(user), user: publicUser(user) };
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}
