import { Router } from "express";
import {
    addProduct,
    analyzeProductImage,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    updateProductById,
    getSellerProducts,
    
} from "../controllers/product.controller.js";
import {
    JWTVerify,
    verifySeller,
} from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const productRouter = Router();

productRouter.route("/analyze").post(
    JWTVerify,
    verifySeller,
    upload.single("productImage"),
    analyzeProductImage
);

productRouter
    .route("/add-product")
    .post(
        JWTVerify, 
        verifySeller, 
        upload.fields([{ name: "productImages", maxCount: 5 }]), 
        addProduct
    );
productRouter
    .route("/update-product/:productId")
    .patch(
        JWTVerify, 
        verifySeller, 
        upload.fields([{ name: "productImages", maxCount: 5 }]), 
        updateProductById
    );
productRouter.route("/all-products").get(getAllProducts);
productRouter.route("/product/:productId").get(JWTVerify, getProductById);
productRouter
    .route("/seller/:sellerId")
    .get(
        JWTVerify,
        verifySeller,
        getSellerProducts
    );
productRouter.route("/category/:category").get(JWTVerify, getProductsByCategory);
productRouter.route("/delete-product/:productId").delete(JWTVerify, verifySeller, deleteProduct);

export default productRouter;
