const multer = require("multer");
const { CloudinaryStorage } =  require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary.js");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "baker_products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

module.exports = { upload };
