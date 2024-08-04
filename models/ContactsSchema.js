const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

contactSchema.plugin(mongoosePaginate);

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
