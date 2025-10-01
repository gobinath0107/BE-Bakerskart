const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Registerdata = {
  username: "Gobinath",
  email: "mgopi@gmail.com",
  password: "Gobinath@123",
  address: "12,A sundarajapuram street",
  city: "Madurai",
  state: "TamilNadu",
  mobile: "9942699100",
  company: "Honey Loaf",
};

const RegisterUserRes = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIwLCJpYXQiOjE3NTkyNDg2NTksImV4cCI6MTc2MTg0MDY1OX0.7WDgHqyDsLle9lrfZAgOtYGiwZW5-qz05Yyrh5n_IVI",
  user: {
    id: 220,
    username: "gokul",
    email: "gopinathmass.ever@gmail.com",
    provider: "local",
    confirmed: true,
    blocked: false,
    createdAt: "2025-09-30T16:10:59.261Z",
    updatedAt: "2025-09-30T16:10:59.261Z",
  },
};

const LoginRes = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIwLCJpYXQiOjE3NTkyNDg3NzcsImV4cCI6MTc2MTg0MDc3N30.wtWx0tKQaBaDvX1AHpG4GP6uz6l94lT-d5ms5JXYmK0",
  user: {
    id: 220,
    username: "gokul",
    email: "gopinathmass.ever@gmail.com",
    provider: "local",
    confirmed: true,
    blocked: false,
    createdAt: "2025-09-30T16:10:59.261Z",
    updatedAt: "2025-09-30T16:10:59.261Z",
  },
};

const loginData = {
  identifier: "mgobinath.shanthi@gmail.com",
  password: "Gobinath@123",
};

const User = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "blocked"],
    },
    softDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

User.pre("save", function (next) {
  const genSalt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(this.password, genSalt);
  this.password = hash;
  next();
});

User.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

User.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      username: this.username,
      email: this.email,
      mobile: this.mobile,
      company: this.company,
      address: this.address,
      city: this.city,
      state: this.state,
      status: this.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};

module.exports = mongoose.model("User", User);
