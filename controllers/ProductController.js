const Product = require("../models/Products");
const Category = require("../models/Category");
const mongoose = require("mongoose");
const cloudinary = require("../utils/cloudinary");

const createProduct = async (req, res) => {
  console.log("ok", req.body, req.files);

  try {
    const {
      title,
      company,
      description,
      category,
      price,
      sellingPrice,
      stock,
      featured,
    } = req.body;

    const cat = await Category.findOne({ name: category });
    if (!cat) return res.status(400).json({ error: "Category not found" });

    // map files to schema fields
    const images = {};
    for (let i = 1; i <= 5; i++) {
      if (req.files[`image${i}`] && req.files[`image${i}`][0]) {
        images[`image${i}`] = {
          url: req.files[`image${i}`][0].path,
          public_id: req.files[`image${i}`][0].filename,
        };
      }
    }

    console.log(images);

    const product = new Product({
      title,
      company,
      description,
      category: cat._id,
      price,
      sellingPrice,
      stock,
      featured: featured || false,
      ...images,
    });

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { search, category, company, order, price, page, limit, featured } =
      req.query;
    const query = {};
    if (featured === "true" || featured === true) query.featured = true;
    if (search) query.title = { $regex: search, $options: "i" };
    if (category && category !== "all") {
      const cat = await Category.findOne({ name: category });
      if (cat) query.category = cat._id;
    }
    if (company && company !== "all") query.company = company;
    if (price) query.sellingPrice = { $lte: Number(price) };

    // sorting
    let sortOption = {};
    if (order === "a-z") sortOption.title = 1;
    if (order === "z-a") sortOption.title = -1;
    if (order === "lowest") sortOption.price = 1;
    if (order === "highest") sortOption.price = -1;

    const pageNum = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (pageNum - 1) * pageSize;

    const products = await Product.find(query)
      .populate("category", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize);

    const total = await Product.countDocuments(query);

    const categories = ["all", ...(await Category.distinct("name"))];
    const companies = ["all", ...(await Product.distinct("company"))];

    res.json({
      data: products,
      meta: {
        pagination: {
          page: pageNum,
          pageSize,
          pageCount: Math.ceil(total / pageSize),
          total,
        },
        categories,
        companies,
      },
    });
  } catch (error) {
    res.status(500).json({ error: err.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name"
    );
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // loop over image1..image5
    for (let i = 1; i <= 5; i++) {
      const key = `image${i}`;

      // Delete if marked
      if (req.body[`delete_${key}`] === "true" && product[key]?.public_id) {
        await cloudinary.uploader.destroy(product[key].public_id);
        product[key] = {}; // reset
      }

      // Upload new file if exists
      if (req.files && req.files[key]) {
        if (product[key]?.public_id) {
          await cloudinary.uploader.destroy(product[key].public_id);
        }
        const file = req.files[key][0];
        product[key] = {
          url: file.path,
          public_id: file.filename,
        };
      }
    }

    if (req.body.featured === "true" || req.body.featured === true) {
      req.body.featured = true;
    } else {
      req.body.featured = false;
    }

    // update other fields
    const {
      title,
      company,
      description,
      category,
      price,
      sellingPrice,
      stock,
      featured,
    } = req.body;

    if (category) {
      const cat = await Category.findOne({ name: category });
      if (!cat) return res.status(400).json({ error: "Category not found" });
      product.category = cat._id;
    }

    product.title = title || product.title;
    product.company = company || product.company;
    product.description = description || product.description;
    product.price = price || product.price;
    product.sellingPrice = sellingPrice || product.sellingPrice;
    product.stock = stock ?? product.stock;
    product.featured = featured ?? product.featured;

    await product.save();
    res.json(product);
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Delete all Cloudinary images (image1 to image5)
    for (let i = 1; i <= 5; i++) {
      const key = `image${i}`;
      if (product[key]?.public_id) {
        await cloudinary.uploader.destroy(product[key].public_id);
      }
    }

    await Product.findOneAndDelete({ _id: product._id });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const q = req.query.q || "";

    const products = await Product.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
      ],
    }).limit(20);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
};
