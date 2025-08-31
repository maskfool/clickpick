import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Set token in cookie
const setTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };
  res.cookie("token", token, options);
};

/**
 * @desc Register user
 * @route POST /api/auth/register
 * @access Public
 */
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 50 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: "Validation failed", details: errors.array() });

      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: "User already exists" });

      const user = await User.create({ name, email, password });

      const token = generateToken(user._id);
      setTokenCookie(res, token);

      res.status(201).json({
        token, // 👈 Frontend can use this directly
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Server error during registration" });
    }
  }
);

/**
 * @desc Login user
 * @route POST /api/auth/login
 * @access Public
 */
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: "Validation failed", details: errors.array() });

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) return res.status(401).json({ error: "Account deactivated" });

      await user.updateLastLogin();

      const token = generateToken(user._id);
      setTokenCookie(res, token);

      res.json({
        token, // 👈 Important for frontend
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          preferences: user.preferences,
          stats: user.stats,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Server error during login" });
    }
  }
);

/**
 * @desc Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
router.post("/logout", (req, res) => {
  res.cookie("token", "none", { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.json({ message: "Logged out successfully" });
});

/**
 * @desc Get current user
 * @route GET /api/auth/me
 * @access Private
 */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Server error while fetching user" });
  }
});

/**
 * @desc Update profile
 * @route PUT /api/auth/profile
 * @access Private
 */
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ user });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Server error while updating profile" });
  }
});

/**
 * @desc Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ error: "Current password incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Password error:", err);
    res.status(500).json({ error: "Server error while changing password" });
  }
});

export default router;