// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const { createOrder,getOrders } = require("../controllers/OrderController.js");
const authMiddleware = require("../middleware/auth");

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);

module.exports = router;
