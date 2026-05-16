import { Product } from "../models/product.model.js";

const findProductById = async (productId) => Product.findById(productId);

export { findProductById };
