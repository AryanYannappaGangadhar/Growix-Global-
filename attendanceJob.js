import cron from "node-cron";
import User from "../models/User.js";
import { Attendance } from "../models/Attendance.js";

function getTodayDateString() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function scheduleDailyAttendanceJob() {
  // Runs at midnight every day
  cron.schedule("0 0 * * *", async () => {
    const today = getTodayDateString();
    const users = await User.find({}, "_id").lean();
    
    for (const u of users) {
      const existing = await Attendance.findOne({ user: u._id, date: today });
      if (!existing) {
        await Attendance.create({
          user: u._id,
          date: today,
          status: "ABSENT"
        });
      }
    }
  });
}
