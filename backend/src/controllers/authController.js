import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail } from "../services/emailService.js";
import { clearRefreshCookie, hashToken } from "../utils/tokens.js";
import {
  issueSession,
  publicUser,
  verifyPassword,
} from "../services/authService.js";

export async function register(req, res, next) {
  let createdUser;

  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    // Validate name
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res.status(400).json({
        message: "Name must be between 2 and 80 characters.",
      });
    }

    // Validate email
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    // Validate password
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Password must be between 8 and 72 characters.",
      });
    }

    // Prevent admin self-registration
    if (role && !["student", "organizer"].includes(role)) {
      return res.status(400).json({
        message: "Choose student or organizer. Admin signup is disabled.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether account already exists
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create unverified account
    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: role || "student",
      emailVerified: false,
      emailVerificationTokenHash: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Send verification email
    try {
      await sendVerificationEmail({
        name: createdUser.name,
        email: createdUser.email,
        token: verificationToken,
      });
    } catch (emailError) {
      await User.deleteOne({ _id: createdUser._id });
      createdUser = null;
      throw emailError;
    }

    // IMPORTANT:
    // Do not create a session during registration.
    // The user must verify their email and log in separately.

    return res.status(201).json({
      message: `Verification link sent to ${normalizedEmail}. Please verify your email before signing in.`,
    });
  } catch (error) {
    if (createdUser && error.code === 11000) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    }

    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = String(req.body.token || "").trim();

    if (!token) {
      return res.status(400).json({
        message: "The verification link is invalid or incomplete.",
      });
    }

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationTokenHash +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        message:
          "This verification link is invalid or has expired. Please register again or request a new link.",
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;

    await user.save();

    // Verification does not create a login session.
    return res.json({
      message:
        "Your email has been verified successfully. You can now sign in.",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+passwordHash +refreshTokenHash");

    // Check credentials first
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    // Block unverified users
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before signing in.",
      });
    }

    // Create session only after successful login
    return res.json(await issueSession(user, res));
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res) {
  try {
    const token = req.cookies.campusly_refresh;

    if (!token || !process.env.JWT_REFRESH_SECRET) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message: "Session expired. Sign in again.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(payload.sub).select("+refreshTokenHash");

    if (
      !user ||
      !user.emailVerified ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== hashToken(token)
    ) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message: "Session expired. Sign in again.",
      });
    }

    return res.json(await issueSession(user, res));
  } catch {
    clearRefreshCookie(res);

    return res.status(401).json({
      message: "Session expired. Sign in again.",
    });
  }
}

export async function me(req, res) {
  return res.json({
    user: publicUser(req.user),
  });
}

export async function logout(req, res) {
  const token = req.cookies.campusly_refresh;

  if (token && process.env.JWT_REFRESH_SECRET) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

      await User.findByIdAndUpdate(payload.sub, {
        $set: { refreshTokenHash: null },
      });
    } catch {
      // Invalid or expired tokens are already unusable.
    }
  }

  clearRefreshCookie(res);

  return res.json({
    message: "Signed out.",
  });
}
