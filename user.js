import express from "express";
import { body, validationResult } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = req.user;
  return res.json({
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    photoUrl: user.photoUrl,
    photoBase64: user.photoBase64,
    createdAt: user.createdAt
  });
});

router.put(
  "/me",
  requireAuth,
  [
    body("fullName").optional().isLength({ min: 2 }),
    body("photoUrl").optional().isURL(),
    body("photoBase64").optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);

    if (typeof req.body.fullName === "string") {
      user.fullName = req.body.fullName;
    }
    if (typeof req.body.photoUrl === "string") {
      user.photoUrl = req.body.photoUrl;
    }
    if (typeof req.body.photoBase64 === "string") {
      user.photoBase64 = req.body.photoBase64;
    }

    await user.save();

    await ActivityLog.create({
      user: user._id,
      type: "profile_update",
      description: "User updated profile"
    });

    return res.json({
      message: "Profile updated",
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      photoUrl: user.photoUrl,
      photoBase64: user.photoBase64
    });
  }
);

export default router;

