import mongoose from "mongoose";
const registrationSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  rollNo: { type: String, required: true, uppercase: true, trim: true, match: /^H\d{6}$/ },
  phone: { type: String, required: true, match: /^\d{10}$/ },
  department: { type: String, required: true, trim: true },
}, { timestamps: true });
registrationSchema.index({ event: 1, user: 1 }, { unique: true });
registrationSchema.index({ event: 1, rollNo: 1 }, { unique: true });
export default mongoose.model("Registration", registrationSchema);