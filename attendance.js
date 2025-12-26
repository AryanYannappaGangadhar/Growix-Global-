import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Attendance } from "../models/Attendance.js";
import { ActivityLog } from "../models/ActivityLog.js";

const router = express.Router();

router.post("/mark", requireAuth, async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  let attendance = await Attendance.findOne({
    user: userId,
    checkInAt: { $gte: startOfDay, $lt: endOfDay },
  });

  if (!attendance) {
    attendance = await Attendance.create({
      user: userId,
      checkInAt: now,
    });

    await ActivityLog.create({
      user: userId,
      type: "attendance_check_in",
      description: "User checked in",
      meta: { checkInAt: now },
    });

    return res.json({ message: "Checked in", attendance });
  }

  if (!attendance.checkOutAt) {
    attendance.checkOutAt = now;
    await attendance.save();

    await ActivityLog.create({
      user: userId,
      type: "attendance_check_out",
      description: "User checked out",
      meta: { checkOutAt: now },
    });

    return res.json({ message: "Checked out", attendance });
  }

  return res.status(400).json({ message: "Already checked in and out today" });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user._id;
  const days = Number(req.query.days || 30);

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const records = await Attendance.find({
    user: userId,
    checkInAt: { $gte: fromDate },
  })
    .sort({ checkInAt: 1 })
    .lean();

  // Ensure status is present for legacy records
  records.forEach(r => {
    if (!r.status) r.status = "PRESENT";
  });

  return res.json({ records });
});

export default router;

