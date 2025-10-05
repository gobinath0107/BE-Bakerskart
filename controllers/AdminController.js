const Admin = require("../models/Admin");

const registerAdmin = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingAdmin = await Admin.findOne({ email, softDelete: false });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const newAdmin = { username, email, password, role };
    const createdAdmin = await Admin.create(newAdmin);
    const token = createdAdmin.createJWT();

    res.status(200).json({ admin: createdAdmin, jwt: token });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login admin
const loginAdmin = async (req, res) => {
  try {
    console.log("ok");

    const { identifier: email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const admin = await Admin.findOne({ email, softDelete: false });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await admin.isPasswordMatch(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = admin.createJWT();
    res.status(200).json({ admin, jwt: token });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    let { page = 1, pageSize = 10 } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    const filter = { softDelete: false };

    // total count
    const total = await Admin.countDocuments(filter);

    // paginated admins
    const admins = await Admin.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("-password"); // 👈 hide password field

    // total pages
    const pageCount = Math.ceil(total / pageSize);

    res.status(200).json({
      data: admins,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount,
          total,
        },
      },
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get single admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin || admin.softDelete) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ admin });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin || admin.softDelete) {
      return res.status(404).json({ message: "Admin not found" });
    }

    Object.assign(admin, req.body);
    await admin.save();
    res.status(200).json({ admin });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Soft delete admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin || admin.softDelete) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await Admin.findByIdAndUpdate(req.params.id, { softDelete: true });
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
