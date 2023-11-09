const express = require("express");
const bodyParser = require("body-parser");
const UserModel = require("../Models/User");
const router = express.Router();

router.use(bodyParser.json());

router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, userName, password } = req.body;

    // Create a new user instance and save it to the database
    const newUser = new UserModel({
      firstName,
      lastName,
      email,
      userName,
      password,
    });
    await newUser.save();

    res.status(201).send({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get("/getUsers", async (req, res) => {
  try {
    const result = await UserModel.find({});
    res.json(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get("/getUser", async (req, res) => {
  try {
    const { userName } = req.query;
    const user = await UserModel.findOne({ userName: userName });

    if (user) {
      res.json(user);
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post("/addContact", async (req, res) => {
  const { userName, contactUserName } = req.body;

  try {
    const user = await UserModel.findOne({ userName });
    const contactUser = await UserModel.findOne({ userName: contactUserName });

    if (!user || !contactUser) {
      return res.status(404).send({ message: "User or Contact not found" });
    }

    // Avoid adding a user as their own contact
    if (user.userName === contactUser.userName) {
      return res
        .status(400)
        .send({ message: "Cannot add yourself as a contact" });
    }

    // Check if the contact is already added
    if (user.contacts.includes(contactUser._id)) {
      return res.status(400).send({ message: "Contact already added" });
    }

    user.contacts.push(contactUser._id);
    await user.save();

    res.send({ message: "Contact added successfully" });
  } catch (error) {
    res.status(500).send({ message: "Server error", error });
  }
});

router.get("/getContacts", async (req, res) => {
  const { userName } = req.query;

  try {
    const user = await UserModel.findOne({ userName }).populate("contacts");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send(user.contacts);
  } catch (error) {
    res.status(500).send({ message: "Server error", error });
  }
});

module.exports=router;
