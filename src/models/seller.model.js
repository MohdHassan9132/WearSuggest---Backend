import mongoose from 'mongoose'
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const sellerSchema = new mongoose.Schema(
{
  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    sparse: true
  },

  password: {
    type: String
  },

  contactNumber: {
    type: String
  },

  source: {
    type: String // instagram, offline store, etc
  },

  avatar: {
    type: String
  },

  refreshToken: {
    type: String
  },
  instagramId: {
    type: String,
    unique: true,
    sparse: true
  },

  igAccessToken: {
    type: String
  },

  igTokenExpiresAt: {
    type: Date
  },

  instagramUsername: {
    type: String,
    trim: true
  },

  instagramConnected: {
    type: Boolean,
    default: false
  }

},
{ timestamps: true }
);

sellerSchema.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

sellerSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

sellerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: "seller" },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRY }
  );
};

sellerSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRY }
  );
};

export const Seller = mongoose.model("Seller",sellerSchema)
