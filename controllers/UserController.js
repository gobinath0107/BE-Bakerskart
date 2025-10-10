const User = require("../models/User");
const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

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
      return res
        .status(400)
        .json({ message: "Please provide email or mobile and password" });
    }

    if (!isNaN(identifier) && /^\d+$/.test(identifier)) {
      user = await User.findOne({
        mobile: Number(identifier),
        softDelete: false,
      });
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

const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ message: "Email or mobile required" });

    let user;
    if (/^\d+$/.test(identifier)) {
      // Mobile user
      user = await User.findOne({
        mobile: Number(identifier),
        softDelete: false,
      });
      if (!user) {
        return res
          .status(404)
          .json({ message: "No user found with this mobile number" });
      }
      // For mobile, don't send OTP, just inform
      return res.status(200).json({
        message:
          "Please contact admin at +91 9751455300 to reset your password",
      });
    } else {
      // Email user
      user = await User.findOne({ email: identifier, softDelete: false });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetToken = otp;
      user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      // Send email via SendGrid with verified sender
      const msg = {
        to: user.email,
        from: "manager.bakerskart@gmail.com", // verified sender
        replyTo: "manager.bakerskart@gmail.com",
        subject: "Password Reset OTP - BAKERSKART",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset OTP</title>
</head>
<body style="margin:0; padding:0; background-color:#f7f5f2; font-family:'Poppins', Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f7f5f2" style="padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="500" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 12px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#fff5e6" style="padding: 25px;">
              <img src="https://res.cloudinary.com/doiwmjhal/image/upload/v1759922062/bk_icon_bg_ipd4wy.png" alt="Bakerskart Logo" width="80" style="display:block; margin-bottom:10px;">
              <h2 style="margin:0; color:#d35400; font-size:26px; font-weight:700; letter-spacing:1px;">BAKERSKART</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px 40px; color:#555; font-size:15px; line-height:1.6;">
              <p style="margin-top:0;">Hello <strong>${user.username || "Customer"}</strong>,</p>
              <p>We received a request to reset your password for your <strong>BAKERSKART</strong> account.</p>
              <p>Your One-Time Password (OTP) is:</p>
              
              <div style="text-align:center; margin: 25px 0;">
                <span style="display:inline-block; font-size:28px; font-weight:700; color:#d35400; letter-spacing:4px;">${otp}</span>
              </div>
              
              <p>This OTP is valid for the next <strong>10 minutes</strong>. Please do not share it with anyone.</p>
              <p>If you did not request this password reset, you can safely ignore this email.</p>

              <p style="margin-top:25px;">Warm regards,</p>
              <p style="color:#d35400; font-weight:600;">Team Bakerskart 🍰</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="#fff5e6" style="padding: 20px 30px; color:#a67c52; font-size:13px;">
              <p style="margin:0;">&copy; ${new Date().getFullYear()} BAKERSKART. All rights reserved.</p>
              <p style="margin:0;">Madurai, Tamil Nadu, India</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      };

      await sgMail.send(msg);

      return res.status(200).json({
        message: "OTP sent to your email",
        otp, // optional, for dev/testing
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to process request", error: error.message });
  }
};

// ---------------- RESET PASSWORD ----------------
const resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    let user;
    if (/^\d+$/.test(identifier)) {
      user = await User.findOne({
        mobile: Number(identifier),
        softDelete: false,
      });
    } else {
      user = await User.findOne({ email: identifier, softDelete: false });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetToken !== otp || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to reset password", error: error.message });
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

const searchUsers = async (req, res) => {
  try {
    const q = req.query.q || "";
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" }}
      ],
    }).select("_id name email company city state username address");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetPassword,
  forgotPassword,
  searchUsers
};
