const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, deleteUser,updateUser } = require("../controllers/UserController");

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);
router.put("/:id", updateUser);

module.exports = router;