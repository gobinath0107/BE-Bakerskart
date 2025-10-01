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

module.exports = mongoose.model("Order", OrderSchema);
