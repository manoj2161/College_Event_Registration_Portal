import { Router } from "express";
import { login, logout, me, refresh, register, verifyEmail } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, me);
export default router;
