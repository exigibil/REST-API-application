const express = require("express");
const router = express.Router();
const Joi = require("joi");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");
const authenticate = require("../api/authMiddleware");
const gravatar = require("gravatar");
const multer = require("multer");
const jimp = require("jimp");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const nodemailerConfig = require("../../config/nodemail");
require("dotenv").config();

const uploadTmp = multer({ dest: "tmp/" });

const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.get("/secure-data", authenticate, (req, res) => {
  const user = req.user;
  res.json({
    message: "This is secure data",
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
});

// Register
(async () => {
  const { nanoid } = await import("nanoid");

  router.post("/register", async (req, res) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        code: 400,
        message: error.details[0].message,
        data: "Bad Request at Joi Library",
      });
    }

    const { username, email, password } = req.body;
    try {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          status: "error",
          code: 409,
          message: "Email already in use",
          data: "Conflict",
        });
      }

      const verificationToken = nanoid();

      const newUser = new User({
        username,
        email,
        avatarURL: gravatar.url(email),
        verificationToken,
      });

      await newUser.setPassword(password);
      await newUser.save();

      res.status(201).json({
        status: "success",
        code: 201,
        data: {
          message: "Registration successful",
          user: {
            email: newUser.email,
            subscription: newUser.subscription,
            verify: newUser.verify,
          },
        },
      });
    } catch (error) {
      console.error("Error during registration:", error);
      if (error.name === "ValidationError") {
        return res
          .status(400)
          .json({ error: "Bad Request", message: error.message });
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
})();

// Login
router.post("/login", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: error.details[0].message,
      data: "Bad Request at Joi Library",
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.isValidPassword(password))) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Incorrect email or password",
        data: {
          message: "Bad Request",
        },
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      status: "success",
      code: 200,
      data: {
        token,
        user: {
          email: user.email,
          subscription: user.subscription,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Logout
router.post("/logout", authenticate, async (req, res) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "error",
      code: 401,
      message: "Unauthorized",
      data: {
        message: "No token provided",
      },
    });
  }

  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: {
          message: "User not found",
        },
      });
    }

    await user.removeToken(token);

    res.status(204).send();
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      status: "error",
      code: 500,
      message: "Internal Server Error",
    });
  }
});

// User Data

router.get("/current", authenticate, async (req, res) => {
  const user = req.user;
  res.status(200).json({
    email: user.email,
    subscription: user.subscription,
  });
});

// Update the user's subscription.( :3000/api/auth/)
router.patch("/", authenticate, async (req, res) => {
  const { subscription } = req.body;

  const validSubscriptions = ["starter", "pro", "business"];
  if (!validSubscriptions.includes(subscription)) {
    return res.status(400).json({
      message: `Invalid subscription value. Must be one of ${validSubscriptions.join(
        ", "
      )}`,
    });
  }

  try {
    const user = req.user;
    user.subscription = subscription;
    await user.save();
    res.status(200).json({
      message: "Subscription updated successfully",
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update the user's avatar.
router.patch(
  "/avatars",
  authenticate,
  uploadTmp.single("avatar"),
  async (req, res) => {
    try {
      const user = req.user;
      const { path: tempPath, originalname } = req.file;
      const ext = path.extname(originalname);
      const filename = `${user._id}${ext}`;
      const avatarsFolder = path.join(__dirname, "../../public/avatars");
      const finalPath = path.join(avatarsFolder, filename);

      const image = await jimp.read(tempPath);
      await image.resize(250, 250).writeAsync(finalPath);

      fs.unlinkSync(tempPath);

      user.avatarURL = `/avatars/${filename}`;
      await user.save();

      res.status(200).json({
        message: "Avatar updated successfully",
        avatarURL: user.avatarURL,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Send email
router.post("/verify", async (req, res) => {
  const { email } = req.body;

  const transporter = nodemailer.createTransport(nodemailerConfig);
  const emailOptions = {
    from: process.env.OUTLOOK_EMAIL,  // Use the environment variable here
    to: email,
    subject: "Nodemailer test",
    text: "Hello. We are testing sending emails!",
  };

  try {
    await transporter.sendMail(emailOptions);
    res.status(201).json({
      status: "success",
      code: 201,
      data: { message: "Verification email sent" },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

// Get user verify email

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.verify = true;
    user.verificationToken = null;
    await user.save();
    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
