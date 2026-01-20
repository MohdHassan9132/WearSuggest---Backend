import { Router } from "express";
import { addClothingItem,getClothingItems,getClothingItemById,deleteClothingItem } from "../controllers/clothingItem.controller.js";
import { JWTVerify } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.post(
  "/",
  JWTVerify,
  upload.single("itemImage"),
  addClothingItem
);
router.get(
  "/",
  JWTVerify,
  getClothingItems
);

router.get(
  "/:id",
  JWTVerify,
  getClothingItemById
);

router.delete(
  "/:id",
  JWTVerify,
  deleteClothingItem
);



export default router;
