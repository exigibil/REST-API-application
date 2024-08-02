// const express = require("express");
// const router = express.Router();
// const User = require("../models/Users");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// router.post("/register", async (req, res) => {
//   const { username, email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (user) {
//     return res.status(409).json({
//       status: "error",
//       code: 409,
//       message: "Email already in use",
//       data: "Conflict",
//     });
//   }
//   try {
//     const newUser = new User({ username, email });
//     await newUser.setPassword(password);
//     await newUser.save();
//     res.status(201).json({
//       status: "success",
//       code: 201,
//       data: {
//         message: "Registration successful",
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email });

//   if (!user || !(await user.isValidPassword(password))) {
//     return res.status(400).json({
//       status: "error",
//       code: 400,
//       message: "Incorrect email or password",
//       data: {
//         message: "Bad Request",
//       },
//     });
//   }

//   const payload = {
//     id: user.id,
//     username: user.username,
//   };

//   const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
//   res.json({
//     status: "success",
//     code: 200,
//     data: {
//       token,
//     },
//   });
// });

// module.exports = router;