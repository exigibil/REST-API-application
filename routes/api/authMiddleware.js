const jwt = require("jsonwebtoken");
const User = require("../../models/Users");
require("dotenv").config();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      message: "No token provided or invalid format",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({
      message: "Not authorized",
    });
  }
};

module.exports = authenticate;
