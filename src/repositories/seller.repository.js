import { Seller } from "../models/seller.model.js";

const findSellerById = async (sellerId) => Seller.findById(sellerId);

export { findSellerById };
