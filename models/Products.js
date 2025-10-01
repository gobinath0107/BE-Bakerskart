// models/Product.js
const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String },
    public_id: { type: String },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide product title"],
    },
    company: {
      type: String,
      required: [true, "Please provide supplier / brand name"],
    },
    description: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image1: { type: ImageSchema, default: {} },
    image2: { type: ImageSchema, default: {} },
    image3: { type: ImageSchema, default: {} },
    image4: { type: ImageSchema, default: {} },
    image5: { type: ImageSchema, default: {} },
    sellingPrice: {
      type: Number,
      required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
