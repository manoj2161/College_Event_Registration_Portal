import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "organizer", "admin"], default: "student", required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false, default: null },
    emailVerificationExpires: { type: Date, select: false, default: null },
    refreshTokenHash: { type: String, select: false, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
