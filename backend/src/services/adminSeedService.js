import bcrypt from "bcryptjs";
import User from "../models/User.js";
export async function ensureAdminAccount() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) {
    console.log(
      "Admin seed skipped. Set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin account.",
    );
    return;
  }
  if (!email || !password)
    throw new Error(
      "Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both empty.",
    );
  if (password.length < 12)
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin")
      throw new Error("ADMIN_EMAIL already belongs to a non-admin account.");
    return;
  }
  const name = process.env.ADMIN_NAME || "Portal Administrator";
  await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "admin",
  });
  console.log(`Admin account ready for ${email}`);
}
