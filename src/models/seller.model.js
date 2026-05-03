import mongoose from 'mongoose'
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const sellerSchema = new mongoose.Schema(
{
  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
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
  }

},
{ timestamps: true }
);

sellerSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

sellerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

sellerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: "seller" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

sellerSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const Seller = mongoose.model("Seller",sellerSchema)
