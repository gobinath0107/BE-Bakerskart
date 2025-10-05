const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, address, city, state, mobile, company } =
      req.body;

    if (email) {
      const existingUser = await User.findOne({ email, softDelete: false });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
    }

    if (mobile) {
      const existingUser = await User.findOne({ mobile, softDelete: false });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Mobile number already exists" });
      }
    }

    const newUser = {
      username,
      email,
      password,
      address,
      city,
      state,
      mobile,
      company,
    };
    const createdUser = await User.create(newUser);
    const token = createdUser.createJWT();
    res.status(200).json({ user: createdUser, jwt: token });
  } catch (error) {
    console.log("error", error);
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log(req.body);
    
    let user = null;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide email or mobile and password" });
    }

    if (!isNaN(identifier) && /^\d+$/.test(identifier)) {
      user = await User.findOne({ mobile: Number(identifier), softDelete: false });
    } else {
      user = await User.findOne({ email: identifier, softDelete: false });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = user.createJWT();

    res.status(200).json({ user, jwt: token });
  } catch (error) {
    console.log("error", error);
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let { page = 1, pageSize = 10 } = req.query;
    page = parseInt(page);
    pageSize = parseInt(pageSize);

    const filter = { softDelete: false };

    // total count
    const total = await User.countDocuments(filter);

    // paginated users
    const users = await User.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("-password"); // 👈 hide password field

    // total pages
    const pageCount = Math.ceil(total / pageSize);

    res.status(200).json({
      data: users,
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

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.softDelete) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.softDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    Object.assign(user, req.body);
    await user.save();
    res.status(200).json({ user });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Soft delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.softDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(req.params.id, { softDelete: true });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
