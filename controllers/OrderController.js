// controllers/orderController.js
const Order = require("../models/Orders");

const createOrder = async (req, res) => {
  try {
    const { data } = req.body;
    const order = await Order.create({
      ...data,
      user: req.user.userId, // assuming you attach userId from token middleware
    });
    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const total = await Order.countDocuments({ user: req.user.userId });

    const orders = await Order.find({ user: req.user.userId })
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      data: orders.map((order) => ({
        id: order._id,
        attributes: {
          name: order.name,
          address: order.address,
          city: order.city,
          state: order.state,
          cartItems: order.cartItems,
          orderTotal: order.orderTotal,
          numItemsInCart: order.numItemsInCart,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        },
      })),
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOrder, getOrders };
