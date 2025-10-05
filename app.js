require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const connectDB = require("./db/connectdb");
const rateLimiter = require("express-rate-limit");
// const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");

//routes
const authRouter = require("./routes/authRouter");
const productRouter = require("./routes/productRouter");
const categoryRouter = require("./routes/categoryRouter");
const orderRouter = require("./routes/orderRouter");
const authAdminRouter = require("./routes/authAdminRouter");
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");

const cors = require("cors");
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  })
);
// app.use(helmet());
// app.use(mongoSanitize());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));
app.use(express.static("public"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/authadmin", authAdminRouter);
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/users", userRouter);

// Sample route
app.get("/", (req, res) => {
  res.json({ message: "Bakerskart Coming Soon!" });
});

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error.message);
    process.exit(1);
  }
};

start();
