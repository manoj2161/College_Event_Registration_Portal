import mongoose from "mongoose";
import "dotenv/config";
export async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected to:", mongoose.connection.name);
}
