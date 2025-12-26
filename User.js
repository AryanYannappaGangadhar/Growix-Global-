import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  photoUrl: { type: String },
  photoBase64: { type: String },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpiresAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
