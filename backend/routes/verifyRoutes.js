// backend/routes/verifyRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");

router.get("/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;