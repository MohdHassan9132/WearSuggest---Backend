import { Router } from "express";
import { addClothingItem, getClothingItems, getClothingItemById, deleteClothingItem, getDeletedClothingItems, restoreClothingItem } from "../controllers/clothingItem.controller.js";
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
  "/deleted",
  JWTVerify,
  getDeletedClothingItems
);

router.get(
  "/:id",
  JWTVerify,
  getClothingItemById
);

router.patch(
  "/:id/restore",
  JWTVerify,
  restoreClothingItem
);

router.delete(
  "/:id",
  JWTVerify,
  deleteClothingItem
);



export default router;
