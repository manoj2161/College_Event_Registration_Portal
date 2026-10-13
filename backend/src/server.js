import "dotenv/config";
import app from "./app.js";
import dns from "node:dns";
import { connectDatabase } from "./config/database.js";
import { ensureAdminAccount } from "./services/adminSeedService.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const port = Number(process.env.PORT || 5000);

try {
  await connectDatabase();
  await ensureAdminAccount();

  app.listen(port, "0.0.0.0", () => {
    console.log(`Campusly API running on port ${port}`);
  });
} catch (error) {
  console.error("Server startup failed:", error);
  process.exit(1);
}
