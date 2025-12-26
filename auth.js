import express from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import User from "../models/User.js";
import { Permission } from "../models/Permission.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { signAuthToken, generateResetToken } from "../utils/tokens.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const router = express.Router();

function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return true;
  }
  return false;
}

function setAuthCookie(res, token) {
  const cookieName = process.env.JWT_COOKIE_NAME || "auth_token";
  const secure = process.env.COOKIE_SECURE === "true";
  const sameSite = process.env.COOKIE_SAME_SITE || "lax";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post(
  "/signup",
  [
    body("email")
      .trim()
      .toLowerCase()
      .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      .withMessage("Invalid email format")
      .custom((email) => {
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS
          ?.split(",")
          .map(d => d.trim().toLocaleLowerCase());

        if (!allowedDomains || allowedDomains.length === 0) {
          throw new Error("Email domains not configured");
        }

        const domain = email.split("@")[1];
        if (!allowedDomains.includes(domain)) {
          throw new Error(
            `Email domain not allowed. Allowed domains: ${allowedDomains.join(", ")}`
          );
        }
        return true;
      }),
    body("username").isLength({ min: 3 }),
    body("password").isLength({ min: 6 }),
    body("confirmPassword").custom((value, { req }) => value === req.body.password)
  ],
  async (req, res) => {
    try {
      const hasErrors = handleValidationErrors(req, res);
      if (hasErrors) return;

      const { fullName, email, username, password } = req.body;

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already in use" });
      }

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ message: "Username already in use" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        fullName,
        email,
        username,
        passwordHash
      });

      await Permission.create({
        user: user._id,
        role: "user",
        canEditProfile: true,
        canViewAttendance: true,
        status: "active"
      });

      await ActivityLog.create({
        user: user._id,
        type: "signup",
        description: "User created account"
      });

      return res.status(201).json({ message: "Account created, please log in" });
    } catch (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ message: "Server error during signup", error: error.message });
    }
  }
);

router.post(
  "/login",
  [body("username").notEmpty(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const hasErrors = handleValidationErrors(req, res);
      if (hasErrors) return;

      const { username, password } = req.body;

      const user =
        (await User.findOne({ username })) || (await User.findOne({ email: username.trim().toLowerCase() }));

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = signAuthToken(
        { sub: user._id.toString(), username: user.username },
        process.env.JWT_SECRET,
        process.env.JWT_EXPIRES_IN || "7d"
      );

      setAuthCookie(res, token);

      await ActivityLog.create({
        user: user._id,
        type: "login",
        description: "User logged in"
      });

      return res.json({ message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error during login", error: error.message });
    }
  }
);

router.post("/logout", async (req, res) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "auth_token";
  res.clearCookie(cookieName);
  return res.json({ message: "Logged out" });
});

router.post(
  "/forgot-password",
  [
    body("email").trim().toLowerCase().isEmail()
  ],
  async (req, res) => {
    const hasErrors = handleValidationErrors(req, res);
    if (hasErrors) return;

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If the email exists, a reset link is sent" });
    }

    const { rawToken, hash } = generateResetToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordTokenHash = hash;
    user.resetPasswordExpiresAt = expires;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:4000";
    const resetLink = `${frontendUrl}/reset-password.html?token=${rawToken}&email=${encodeURIComponent(
      email
    )}`;

    await sendPasswordResetEmail(email, resetLink);

    await ActivityLog.create({
      user: user._id,
      type: "password_reset_request",
      description: "User requested password reset"
    });

    return res.json({ message: "If the email exists, a reset link is sent" });
  }
);

router.post(
  "/reset-password",
  [
    body("email").trim().toLowerCase().isEmail(),
    body("token").notEmpty(),
    body("password").isLength({ min: 6 }),
    body("confirmPassword").custom((value, { req }) => value === req.body.password)
  ],
  async (req, res) => {
    const hasErrors = handleValidationErrors(req, res);
    if (hasErrors) return;

    const { email, token, password } = req.body;
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordTokenHash: hash,
      resetPasswordExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await ActivityLog.create({
      user: user._id,
      type: "password_reset",
      description: "User reset password"
    });

    return res.json({ message: "Password updated, you can log in" });
  }
);

export default router;
