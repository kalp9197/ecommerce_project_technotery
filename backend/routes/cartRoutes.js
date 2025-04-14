import express from "express";
import { authenticate } from "../middlewares/auth.js";
import * as cartController from "../controllers/cartController.js";

const router = express.Router();

// All cart operations require authentication
router.use(authenticate);

// Cart routes
router.get("/", cartController.getUserCart);
router.post("/items", cartController.addItemToCart);
router.put("/items/:id", cartController.updateCartItem);
router.put("/items/deactivate/:id", cartController.deactivateCartItem); 
router.put("/deactivate", cartController.deactivateAllCartItems);

export default router;
