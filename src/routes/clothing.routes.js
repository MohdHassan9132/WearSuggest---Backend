import { Router } from "express";
import { addClothingItem, getClothingItems, getClothingItemById, deleteClothingItem, getDeletedClothingItems, restoreClothingItem, analyzeClothingImage } from "../controllers/clothingItem.controller.js";
import { JWTVerify,verifyUser } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/analyze").post(
  JWTVerify,
  upload.single("itemImage"),
  analyzeClothingImage
);


router.route("/").post(
  JWTVerify,
  verifyUser,
  upload.single("itemImage"),
  addClothingItem
);

router.get(
  "/",
  JWTVerify,
  verifyUser,
  getClothingItems
);

router.get(
  "/deleted",
  JWTVerify,
  verifyUser,
  getDeletedClothingItems
);

router.get(
  "/:id",
  JWTVerify,
  verifyUser,
  getClothingItemById
);

router.patch(
  "/:id/restore",
  JWTVerify,
  verifyUser,
  restoreClothingItem
);

router.delete(
  "/:id",
  JWTVerify,
  verifyUser,
  deleteClothingItem
);



export default router;
