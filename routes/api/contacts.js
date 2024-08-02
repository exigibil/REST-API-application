const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Contact = require("../../models/ContactsSchema");
const mongoose = require("mongoose");
const passport = require("passport");


<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
// const userSchema = Joi.object({
//   name: Joi.string().required(),
//   email: Joi.string().email().required(),
//   phone: Joi.string().required(),
//   favorite: Joi.boolean(),
// });

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

const auth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    console.log(user);
    if (!user || err) {
      const error = new Error("Unauthorized");
      error.status = 401;
      return next(error);
    }
    req.user = user;
    next();
  })(req, res, next);
};


// Route GET all contacts
router.get("/", auth, async (req, res, next) => {
  try {
    const data = await Contact.find();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route GET by ID
router.get("/:contactId", auth, async (req, res, next) => {
  try {
    const contactId = req.params.contactId;

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "ID contact invalid" });
    }

    const contact = await Contact.findById(contactId);
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
router.post("/", auth, async (req, res) => {
  try {
    const { error } = postSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const newItem = new Contact(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route DELETE
router.delete("/:contactId", auth, async (req, res) => {
  try {
    const contactId = req.params.contactId;

    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({ error: "invalid contactId" });
    }

    const result = await Contact.deleteOne({ _id: contactId });

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
router.put("/:contactId", auth, async (req, res) => {
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
      contactId,
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


const updateStatusContact = async (contactId, body) => {
  try {
 
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      return null;
    }

   
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId, 
      { favorite: body.favorite }, 
      { new: true } 
    );

    return updatedContact;
  } catch (err) {
    console.error('Error updating contact status:', err);
    return null;
  }
};


router.patch('/:contactId/favorite', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { favorite } = req.body;

    if (favorite === undefined) {
      return res.status(400).json({ message: 'missing field favorite' });
    }

    if (typeof favorite !== 'boolean') {
      return res.status(400).json({ message: 'field favorite must be a boolean' });
    }

    const updatedContact = await updateStatusContact(contactId, { favorite });

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    console.error('Error handling PATCH request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
