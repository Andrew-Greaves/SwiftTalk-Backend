const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
  body: { type: String },
  author: { type: Schema.Types.ObjectId, ref: "users" },
  createdAt: { type: Date, default: Date.now },
});

const MessageModel = mongoose.model("Message", messageSchema);
module.exports = MessageModel;
