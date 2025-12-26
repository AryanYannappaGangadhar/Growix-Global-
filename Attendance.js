import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE"], default: "PRESENT" },
    date: { type: Date }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, checkInAt: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);

