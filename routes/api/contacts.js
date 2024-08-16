const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Contact = require("../../models/ContactsSchema");
const mongoose = require("mongoose");
const authenticate = require("../api/authMiddleware");

const postSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
});

const putSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string(),
  favorite: Joi.boolean(),
});

// GET by page
router.get("/", authenticate, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  console.log("User ID:", req.user._id);

  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const data = await Contact.paginate({ owner: req.user._id }, options);
    console.log("Paginate result:", data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get Favorite (postman :3000/api/contacts/favorite?favorite=true)
router.get("/favorite", authenticate, async (req, res) => {
  const { favorite } = req.query;

  console.log("Query Parameters:", req.query);

  const filter = { owner: req.user._id };
  if (favorite !== undefined) {
    filter.favorite = favorite === "true";
  }
  console.log("Filter:", filter);

  try {
    const contacts = await Contact.find(filter);
    console.log("Contacts Found:", contacts);
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Route GET by ID
router.get("/:contactId", authenticate, async (req, res, next) => {
  try {
    const contactId = req.params.contactId;

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "ID contact invalid" });
    }

    const contact = await Contact.findById({
      _id: contactId,
      owner: req.user._id,
    });
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ error: "Contact not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route POST
router.post("/", authenticate, async (req, res) => {
  try {
    const { error } = postSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const newItem = new Contact({
      ...req.body,
      owner: req.user._id,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Error adding new item:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route DELETE
router.delete("/:contactId", authenticate, async (req, res) => {
  try {
    const contactId = req.params.contactId;

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "invalid contactId" });
    }

    const result = await Contact.deleteOne({
      _id: contactId,
      owner: req.user._id,
    });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Contact deleted successfully" });
    } else {
      res.status(404).json({ error: "Contact not found" });
    }
  } catch (err) {
    console.error("Delete contact error :", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route PUT
router.put("/:contactId", authenticate, async (req, res) => {
  try {
    const { error } = putSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, phone, favorite } = req.body;

    if (!name && !email && !phone && favorite === undefined) {
      return res.status(400).json({ message: "missing fields" });
    }

    const contactId = req.params.contactId;
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "Invalid contact ID" });
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      { _id: contactId, owner: req.user._id },
      {
        name,
        email,
        phone,
        favorite,
      },
      { new: true }
    );

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const updateStatusContact = async (contactId, body, userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return null;
    }

    const updatedContact = await Contact.findOneAndUpdate(
      { _id: contactId, owner: userId },
      { favorite: body.favorite },
      { new: true }
    );

    return updatedContact;
  } catch (err) {
    console.error("Error updating contact status:", err);
    return null;
  }
};

router.patch("/:contactId/favorite", authenticate, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;

    if (favorite === undefined) {
      return res.status(400).json({ message: "missing field favorite" });
    }

    if (typeof favorite !== "boolean") {
      return res
        .status(400)
        .json({ message: "field favorite must be a boolean" });
    }

    const updatedContact = await updateStatusContact(
      contactId,
      { favorite },
      req.user._id
    );

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    console.error("Error handling PATCH request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
