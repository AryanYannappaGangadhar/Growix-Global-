import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    canEditProfile: { type: Boolean, default: true },
    canViewAttendance: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "suspended"], default: "active" }
  },
  { timestamps: true }
);

export const Permission = mongoose.model("Permission", permissionSchema);

