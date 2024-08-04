const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  subscription: {
    type: String,
    default: "starter",
  },
  tokens: [{ type: String }],
});

userSchema.methods.setPassword = async function (password) {
  this.password = await bcrypt.hash(password, 10);
};

userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.addToken = function (token) {
  this.tokens.push(token);
  return this.save();
};

userSchema.methods.removeToken = function (token) {
  this.tokens = this.tokens.filter((t) => t !== token);
  return this.save();
};

const User = mongoose.model("User", userSchema);

module.exports = User;
