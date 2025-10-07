const mongoose = require("mongoose");

const SingleCartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  name: String,
  image: String,
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },

    cartItems: [SingleCartItemSchema],
    discount: { type:Number, default: 0 },

    numItemsInCart: { type: Number, required: true },
    chargeTotal: { type: Number, required: true }, // raw number
    orderTotal: { type: String, required: true }, // formatted currency string

    status: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

OrderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastOrder = await this.constructor.findOne().sort({ createdAt: -1 });
    const lastNumber = lastOrder ? parseInt(lastOrder.orderId?.replace("ORD", "")) || 1000 : 1000;
    this.orderId = `ORD${lastNumber + 1}`;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
