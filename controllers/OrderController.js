// controllers/orderController.js
const Order = require("../models/Orders");
const fs = require("fs")
const path = require("path")
const PDFDocument = require("pdfkit")

const createOrder = async (req, res) => {
  try {
    const { data } = req.body;
    let { cartItems, discount = 0 } = data;
    const chargeTotal = cartItems.reduce((sum, item) => sum + item.price * item.amount, 0);

    // Apply fixed discount (₹)
    const discountedTotal = Math.max(0, chargeTotal - discount);
    const order = await Order.create({
      ...data,
      user: req.user.userId,
      chargeTotal,
      discount,
      orderTotal: `${discountedTotal.toLocaleString()}`,
    });
    res.status(200).json({ order });
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

    const findOrderQuery = {}

    if(req.user && req.user.role && req.user.role === "user"){
      findOrderQuery.user = req.user.userId
    }

    const orders = await Order.find(findOrderQuery)
      .populate("user")
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      data: orders.map((order) => ({
        id: order._id,
        attributes: {
          orderId: order.orderId,
          name: order.name,
          address: order.address,
          city: order.city,
          state: order.state,
          cartItems: order.cartItems,
          orderTotal: order.orderTotal,
          numItemsInCart: order.numItemsInCart,
          status: order.status,
          user: order.user,
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

const getOrderById = async (req,res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user")
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Flexible update order
const updateOrder = async (req, res) => {
  try {
    const { status, cartItems, discount } = req.body; // discount = fixed amount (₹)
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Update status if provided
    if (status) order.status = status;

    // Update discount if provided
    if (discount !== undefined) order.discount = Number(discount);

    // Update cart items if provided
    if (cartItems && Array.isArray(cartItems)) {
      order.cartItems = cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        amount: item.amount,
      }));
    }

    //Always recalculate totals (whether items or discount changed)
    const chargeTotal = order.cartItems.reduce(
      (total, item) => total + item.price * item.amount,
      0
    );

    // Apply fixed discount
    const discountedTotal = Math.max(0, chargeTotal - (order.discount || 0));

    order.chargeTotal = chargeTotal;
    order.numItemsInCart = order.cartItems.reduce(
      (sum, i) => sum + i.amount,
      0
    );
    order.orderTotal = `₹${discountedTotal.toLocaleString()}`;

    await order.save();

    res.status(200).json({ message: "Order updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.log("error",error);
    
    res.status(500).json({ error: error.message });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const doc = new PDFDocument({ margin: 50 });

    // Set headers before streaming
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${orderId}.pdf`
    );

    // Pipe directly to response
    doc.pipe(res);

    // Load font and logo if available
    const fontPath = path.join(__dirname, "../fonts/NotoSans.ttf");
    if (fs.existsSync(fontPath)) doc.registerFont("NotoSans", fontPath).font("NotoSans");
    const logoPath = path.join(__dirname, "../public/logo.jpeg");

    // ===== HEADER =====
    doc.rect(0, 0, doc.page.width, 100).fill("#f5f7fa");
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 25, { width: 60, height: 60 });
    doc
      .fillColor("#2c3e50")
      .fontSize(28)
      .text("BAKERSKART", 110, 40)
      .fontSize(10)
      .fillColor("#34495e")
      .text("Madurai, Tamil Nadu, India", 400, 35)
      .text("625011", 400, 50)
      .text("manager.bakerskart@gmail.com", 400, 65)
      .text("www.bakerskart.in", 400, 80);

    // ===== DATE & CUSTOMER =====
    const date = new Date(order.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    doc
      .fillColor("#2c3e50")
      .fontSize(12)
      .text("Billed To:", 50, 130)
      .fontSize(10)
      .text(order.name, 50, 150)
      .text(order.address, 50, 165)
      .text(order.user.email || order.user.mobile, 50, 180)
      .fontSize(10)
      .text(`Invoice #: ${order.orderId || "INV-" + order._id.toString().slice(-6)}`, 400, 130)
      .text(`Date: ${date}`, 400, 145)
      .text(`Status: ${order.status}`, 400, 160);

    // ===== TABLE =====
    const tableTop = 210;
    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text("Description", 50, tableTop)
      .text("Unit Cost", 250, tableTop)
      .text("Qty", 350, tableTop)
      .text("Amount", 420, tableTop);

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor("#dfe6e9")
      .stroke();

    let y = tableTop + 25;
    order.cartItems.forEach((item, index) => {
      if (index % 2 === 0) {
        doc.rect(50, y - 4, 500, 20).fill("#f8f9fa").fillColor("#2c3e50");
      }
      doc
        .fontSize(10)
        .text(item.name, 50, y, { width: 180 })
        .text(`₹${item.price.toFixed(2)}`, 250, y)
        .text(item.amount.toString(), 350, y)
        .text(`₹${(item.price * item.amount).toFixed(2)}`, 420, y);
      y += 20;
    });

    // ===== TOTALS =====
    y += 20;
    const subtotal = order.cartItems.reduce((t, i) => t + i.price * i.amount, 0);
    const discount = order.discount || 0;
    const total = Math.max(0, subtotal - discount);

    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text(`Subtotal: ₹${subtotal.toFixed(2)}`, 400, y)
      .text(`Discount: ₹${discount.toFixed(2)}`, 400, y + 15)
      .fillColor("#007BFF")
      .fontSize(12)
      .text(`Total: ₹${total.toFixed(2)}`, 400, y + 35);

    // ===== FOOTER =====
    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text("Thank you for your purchase! We hope to serve you again.", 50, y + 70, {
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



module.exports = { createOrder, getOrders, getOrderById, updateOrder,deleteOrder,generateInvoice };
