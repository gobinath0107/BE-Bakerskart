const Category = require("../models/Category");

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    // Get query params for pagination
    const page = parseInt(req.query.page) || 1; // default to page 1
    const pageSize = parseInt(req.query.pageSize) || 10; // default to 10 per page

    // Count total documents
    const total = await Category.countDocuments();

    // Fetch paginated data
    const categories = await Category.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const pageCount = Math.ceil(total / pageSize);

    res.json({
      data: categories,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    const { name, description } = req.body;
    category.name = name || category.name;
    category.description = description || category.description;
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
