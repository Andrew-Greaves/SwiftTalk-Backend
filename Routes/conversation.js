const express = require("express");
const bodyParser = require("body-parser");
const ConversationModel = require("../Models/Conversation");
const UserModel = require("../Models/User");
const MessageModel=require("../Models/Message")
const router = express.Router();

router.use(bodyParser.json());


router.post("/newConversation", async (req, res) => {
  try {
    const { participantIds } = req.body; // Assume an array of user IDs

    const validationPromises = participantIds.map(async (userId) => {
      const user = await UserModel.findById(userId).populate("contacts");

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const contactsIds = user.contacts.map((contact) =>
        contact._id.toString().trim()
      );

      // Only check that other participants are in the user's contacts
      const allParticipantsAreContacts = participantIds
        .filter((pid) => pid !== userId) // Important change here
        .every((pid) => contactsIds.includes(pid.trim()));

      if (!allParticipantsAreContacts) {
        throw new Error(
          `User with ID ${userId} does not have all participants as contacts`
        );
      }

      return true;
    });
    // Resolve all validation promises
    await Promise.all(validationPromises);

    // If validation passes, create a new conversation
    const newConversation = new ConversationModel({
      participants: participantIds,
    });
    await newConversation.save();

    res.status(201).send({
      message: "Conversation created successfully!",
      conversationId: newConversation._id,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).send({ error: error.message });
  }
});

router.get("/byUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find conversations that include the user as a participant
    const conversations = await ConversationModel.find({
      participants: userId, 
    })
      .populate({
        path: "participants",
        select: "firstName lastName", // Exclude the _id if you don't need it
      })
      .populate({
        path: "lastMessage.sentBy",
        select: "username", // Or "firstName lastName" if you need to display the name
      })
      .select("lastMessage"); // Make sure you are selecting the text field

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations by user:", error);
    res.status(500).send({ error: error.message });
  }
});

router.post("/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { body, author } = req.body; // Assuming we pass the message body and author's user ID.

    // Check if the conversation exists
    const conversationExists = await ConversationModel.exists({
      _id: conversationId,
    });
    if (!conversationExists) {
      return res.status(404).send({ message: "Conversation not found" });
    }

    // Check if 'author' is a participant of the conversation
    const isParticipant = await ConversationModel.findOne({
      _id: conversationId,
      participants: author,
    });
    if (!isParticipant) {
      return res
        .status(403)
        .send({ message: "Sender is not a participant of the conversation" });
    }

    // Create and save a new message in the Message collection
    const newMessage = await new MessageModel({
      conversationId: conversationId,
      body: body,
      author: author,
      // createdAt is set by default to Date.now() if not provided
    }).save();

    // Update the last message for the conversation
    await ConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: body,
        sentBy: author,
        sentAt: new Date(), // Use the createdAt from the saved message
      },
    });

    // Emit the message to the same room for other participants via WebSocket
    const io = req.app.get("socketio");
    io.to(conversationId).emit("messageReceived", newMessage);

    // Respond with the saved message
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Route to get messages by conversation ID
router.get('/:conversationId/getMessages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await MessageModel.find({ conversationId: conversationId })
      .populate('author', 'username') // Ensure 'username' is the correct field you want to populate from the 'users' collection
      .sort({ createdAt: 1 }); // This will sort by the 'createdAt' field in ascending order

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;

