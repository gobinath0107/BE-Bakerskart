const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/UserController');

router.post('/register', registerUser);
router.post('/login', loginUser);

// 🔐 Password reset routes
router.post("/forgot-password", forgotPassword); // Step 1: Send link or OTP
router.post("/reset-password", resetPassword);   // Step 2: Set new password

module.exports = router;
