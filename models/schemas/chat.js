const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const chatSchema = new Schema({
  rstatus: String,
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
  },
  message: {
    createdOn: Date,
    text: String,
    timeStamp: String,
    owner: String,
    attachments: { path: String, _type: String },
    messageType: {
      type: String,
      enum: ["text", "video", "image", "document"],
    },
  },
});

module.exports = model("Chat", chatSchema);
