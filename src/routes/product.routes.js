import { Router } from "express";
import {
    addProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    updateProductById,
} from "../controllers/product.controller.js";
import {
    JWTVerify,
    verifySeller,
} from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const productRouter = Router();

productRouter
    .route("/add-product")
    .post(JWTVerify, verifySeller, upload.single("image"), addProduct);
productRouter
    .route("/update-product/:productId")
    .patch(JWTVerify, verifySeller, upload.single("image"), updateProductById);
productRouter.route("/all-products").get(JWTVerify,getAllProducts);
productRouter.route("/product/:productId").get(JWTVerify, getProductById);
productRouter.route("/category/:category").get(JWTVerify, getProductsByCategory);
productRouter.route("/delete-product/:productId").delete(JWTVerify, verifySeller, deleteProduct);

export default productRouter;
