import mongoose from "mongoose";
import "dotenv/config";

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB connected to:", mongoose.connection.name);
}
