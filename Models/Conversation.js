const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "users" }],
  lastMessage: {
    text: { type: String },
    sentBy: { type: Schema.Types.ObjectId, ref: "users" },
    sentAt: { type: Date, default: Date.now },
  },
});

const ConversationModel = mongoose.model("Conversation", conversationSchema);
module.exports = ConversationModel;
