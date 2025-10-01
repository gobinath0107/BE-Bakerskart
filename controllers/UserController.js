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
    let user = null;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please provide email or mobile and password" });
    }

    if (typeof identifier === "number") {
      user = await User.findOne({ mobile: identifier, softDelete: false });
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

module.exports = {
  registerUser,
  loginUser,
};
