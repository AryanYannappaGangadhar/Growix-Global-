import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Attendance } from "../models/Attendance.js";

const router = express.Router();

function normalizeDateToMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/overview", requireAuth, async (req, res) => {
  const userId = req.user._id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const records = await Attendance.find({
    user: userId,
    checkInAt: { $gte: normalizeDateToMidnight(monthStart), $lt: normalizeDateToMidnight(nextMonthStart) }
  }).lean();

  // Ensure status is present for legacy records
  records.forEach(r => {
    if (!r.status) r.status = "PRESENT";
  });

  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "PRESENT").length;
  const attendanceRate = totalDays === 0 ? 0 : Math.round((presentDays / totalDays) * 100);

  return res.json({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    totalDays,
    presentDays,
    attendanceRate,
    records
  });
});

export default router;

