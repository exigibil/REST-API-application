const express = require("express");
const router = express.Router();
const Joi = require("joi");
const User = require("../../models/Users");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

//Register
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
  const user = await User.findOne({ email });

  if (user) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Email already in use",
      data: "Conflict",
    });
  }

  try {
    const newUser = new User({ username, email });
    await newUser.setPassword(password);
    await newUser.save();
    res.status(201).json({
      status: "success",
      code: 201,
      data: {
        message: "Registration successful",
        user: {
          email: newUser.email,
          subscription: newUser.subscription
        }
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Login
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

  try{
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
  
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({
      status: "success",
      code: 200,
      data: {
        token,
        user : {
        email: user.email,
        subscription : user.subscription,
    }
      },
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ error: "Internal Server Error" });
  }

});

module.exports = router;
