import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  category: { type: String, trim: true, default: "Other", maxlength: 50 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  organizerName: { type: String, required: true, trim: true, maxlength: 100 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  location: { type: String, required: true, enum: ["Pragti Room", "MP Hall", "Ground"] },
  departments: { type: [String], required: true, validate: v => v.length > 0 },
  seats: { type: Number, required: true, min: 1, max: 5000 },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });
eventSchema.index({ status: 1, date: 1 });
export default mongoose.model("Event", eventSchema);