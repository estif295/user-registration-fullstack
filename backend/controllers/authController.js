// backend/controllers/authController.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// -------------------- REGISTER USER --------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Validate input
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    // Name must be letters only
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name))
      return res.status(400).json({ message: "Name can only contain letters" });

    // 2️⃣ Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already exists" });

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 5️⃣ Save user in database
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      emailVerified: false,
    });

    await user.save();

    // 6️⃣ Send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Verify Your Email",
      html: `<p>Hello ${user.name},</p>
             <p>Click the link below to verify your email:</p>
             <a href="http://localhost:5000/api/verify/${verificationToken}">Verify Email</a>`,
    };

    await transporter.sendMail(mailOptions);

    // 7️⃣ Respond success
    res.status(201).json({
      message: "User registered. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- LOGIN USER --------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    // 2️⃣ Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 3️⃣ Check if email is verified
    if (!user.emailVerified)
      return res.status(400).json({ message: "Please verify your email before logging in" });

    // 4️⃣ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // 5️⃣ Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // 6️⃣ Return user info and token
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};