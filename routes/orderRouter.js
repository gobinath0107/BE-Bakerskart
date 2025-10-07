// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const { createOrder,getOrders,getOrderById,updateOrder,deleteOrder,generateInvoice } = require("../controllers/OrderController.js");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.get("/:id", authMiddleware, getOrderById)
router.patch("/:id", authMiddleware, updateOrder)
router.delete("/:id", authMiddleware,deleteOrder)
router.get("/:id/invoice", generateInvoice);

module.exports = router;
