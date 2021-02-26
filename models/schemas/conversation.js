const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const conversationSchema = new Schema({
  sender: {
    userId: String,
    username: String,
    profile_pic: String,
  },
  receiver: {
    userId: String,
    username: String,
    profile_pic: String,
  },
});

module.exports = model("Conversation", conversationSchema);
