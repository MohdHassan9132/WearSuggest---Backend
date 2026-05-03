import mongoose from "mongoose";
import dotenv from "dotenv";
import databaseConnection from "../db/index.js"; // adjust path
import { Product } from "../models/product.model.js"; // adjust path

dotenv.config();

const SELLER_ID = "69f604784805768149698351"; // required field

const products = [
  // 👕 UPPER (15)
  { type: "upper", category: "shirt", fitData: { fitType: "slim", upper: { chest: 105, waist: 96, shoulder: 46, sleeveLength: 66 } } }, // PERFECT
  { type: "upper", category: "shirt", fitData: { fitType: "regular", upper: { chest: 107, waist: 98, shoulder: 46, sleeveLength: 66 } } }, // PERFECT
  { type: "upper", category: "tshirt", fitData: { fitType: "slim", upper: { chest: 102, waist: 94, shoulder: 45, sleeveLength: 65 } } }, // GOOD
  { type: "upper", category: "tshirt", fitData: { fitType: "regular", upper: { chest: 110, waist: 100, shoulder: 47, sleeveLength: 67 } } }, // GOOD
  { type: "upper", category: "shirt", fitData: { fitType: "regular", upper: { chest: 112, waist: 102, shoulder: 47, sleeveLength: 67 } } }, // GOOD
  { type: "upper", category: "shirt", fitData: { fitType: "loose", upper: { chest: 115, waist: 105, shoulder: 48, sleeveLength: 68 } } }, // GOOD
  { type: "upper", category: "tshirt", fitData: { fitType: "loose", upper: { chest: 118, waist: 108, shoulder: 49, sleeveLength: 69 } } }, // GOOD
  { type: "upper", category: "shirt", fitData: { fitType: "slim", upper: { chest: 101, waist: 93, shoulder: 45, sleeveLength: 65 } } }, // GOOD
  { type: "upper", category: "shirt", fitData: { fitType: "slim", upper: { chest: 99, waist: 91, shoulder: 44, sleeveLength: 64 } } }, // GOOD
  { type: "upper", category: "tshirt", fitData: { fitType: "slim", upper: { chest: 98, waist: 90, shoulder: 44, sleeveLength: 64 } } }, // BAD
  { type: "upper", category: "shirt", fitData: { fitType: "slim", upper: { chest: 96, waist: 88, shoulder: 43, sleeveLength: 63 } } }, // BAD
  { type: "upper", category: "shirt", fitData: { fitType: "slim", upper: { chest: 95, waist: 87, shoulder: 42, sleeveLength: 62 } } }, // BAD
  { type: "upper", category: "tshirt", fitData: { fitType: "loose", upper: { chest: 122, waist: 112, shoulder: 50, sleeveLength: 70 } } }, // BAD
  { type: "upper", category: "shirt", fitData: { fitType: "loose", upper: { chest: 125, waist: 115, shoulder: 51, sleeveLength: 71 } } }, // BAD
  { type: "upper", category: "shirt", fitData: { fitType: "loose", upper: { chest: 130, waist: 120, shoulder: 52, sleeveLength: 72 } } }, // BAD

  // 👖 LOWER (15)
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 88, thigh: 62, length: 103 } } }, // PERFECT
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 90, thigh: 64, length: 104 } } }, // PERFECT
  { type: "lower", category: "chinos", fitData: { fitType: "slim", lower: { waist: 87, thigh: 61, length: 103 } } }, // PERFECT
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 92, thigh: 66, length: 105 } } }, // GOOD
  { type: "lower", category: "chinos", fitData: { fitType: "regular", lower: { waist: 93, thigh: 67, length: 105 } } }, // GOOD
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 84, thigh: 58, length: 102 } } }, // GOOD
  { type: "lower", category: "pants", fitData: { fitType: "slim", lower: { waist: 83, thigh: 57, length: 101 } } }, // GOOD
  { type: "lower", category: "pants", fitData: { fitType: "slim", lower: { waist: 82, thigh: 56, length: 101 } } }, // GOOD
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 95, thigh: 70, length: 106 } } }, // GOOD
  { type: "lower", category: "pants", fitData: { fitType: "regular", lower: { waist: 80, thigh: 55, length: 100 } } }, // BAD
  { type: "lower", category: "pants", fitData: { fitType: "regular", lower: { waist: 79, thigh: 54, length: 100 } } }, // BAD
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 78, thigh: 53, length: 99 } } }, // BAD
  { type: "lower", category: "pants", fitData: { fitType: "regular", lower: { waist: 100, thigh: 74, length: 109 } } }, // BAD
  { type: "lower", category: "pants", fitData: { fitType: "regular", lower: { waist: 102, thigh: 76, length: 110 } } }, // BAD
  { type: "lower", category: "jeans", fitData: { fitType: "regular", lower: { waist: 105, thigh: 78, length: 110 } } }, // BAD

  // 🧥 OUTERWEAR (10)
  { type: "outerwear", category: "jacket", fitData: { fitType: "regular", upper: { chest: 110, waist: 100, shoulder: 45, sleeveLength: 65 } } }, // GOOD
  { type: "outerwear", category: "jacket", fitData: { fitType: "regular", upper: { chest: 112, waist: 102, shoulder: 46, sleeveLength: 66 } } }, // GOOD
  { type: "outerwear", category: "jacket", fitData: { fitType: "regular", upper: { chest: 118, waist: 108, shoulder: 48, sleeveLength: 67 } } }, // PERFECT
  { type: "outerwear", category: "coat", fitData: { fitType: "regular", upper: { chest: 120, waist: 110, shoulder: 48, sleeveLength: 67 } } }, // PERFECT
  { type: "outerwear", category: "coat", fitData: { fitType: "regular", upper: { chest: 125, waist: 115, shoulder: 50, sleeveLength: 69 } } }, // GOOD
  { type: "outerwear", category: "coat", fitData: { fitType: "regular", upper: { chest: 128, waist: 118, shoulder: 50, sleeveLength: 69 } } }, // GOOD
  { type: "outerwear", category: "coat", fitData: { fitType: "regular", upper: { chest: 130, waist: 120, shoulder: 51, sleeveLength: 70 } } }, // BAD
  { type: "outerwear", category: "coat", fitData: { fitType: "regular", upper: { chest: 135, waist: 125, shoulder: 52, sleeveLength: 71 } } }, // BAD
  { type: "outerwear", category: "jacket", fitData: { fitType: "regular", upper: { chest: 105, waist: 96, shoulder: 46, sleeveLength: 66 } } }, // GOOD
  { type: "outerwear", category: "jacket", fitData: { fitType: "regular", upper: { chest: 100, waist: 92, shoulder: 44, sleeveLength: 64 } } }, // BAD

  // 👟 FOOTWEAR (10)
  { type: "footwear", category: "sneakers", fitData: { footwear: { region: "UK", size: 9 } } }, // PERFECT
  { type: "footwear", category: "sneakers", fitData: { footwear: { region: "UK", size: 9.5 } } }, // GOOD
  { type: "footwear", category: "shoes", fitData: { footwear: { region: "UK", size: 10 } } }, // GOOD
  { type: "footwear", category: "shoes", fitData: { footwear: { region: "UK", size: 8.5 } } }, // BAD
  { type: "footwear", category: "sneakers", fitData: { footwear: { region: "UK", size: 8 } } }, // BAD
  { type: "footwear", category: "shoes", fitData: { footwear: { region: "UK", size: 7 } } }, // BAD
  { type: "footwear", category: "sneakers", fitData: { footwear: { region: "UK", size: 10.5 } } }, // BAD
  { type: "footwear", category: "shoes", fitData: { footwear: { region: "UK", size: 11 } } }, // BAD
  { type: "footwear", category: "sneakers", fitData: { footwear: { region: "UK", size: 9 } } }, // PERFECT
  { type: "footwear", category: "shoes", fitData: { footwear: { region: "UK", size: 9 } } }, // PERFECT
];

const seed = async () => {
  try {
    await databaseConnection();

    await Product.deleteMany();

    const finalProducts = products.map(p => ({
      ...p,
      seller: SELLER_ID,
      imageURL: "dummy.jpg",
      imagePublicId: "dummy"
    }));

    const result = await Product.insertMany(finalProducts);

    console.log(`✅ Inserted ${result.length} products`);
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

seed();