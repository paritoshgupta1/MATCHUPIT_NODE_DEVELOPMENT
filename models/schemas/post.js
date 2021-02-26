const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const postsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  communityId: {
    type: Schema.Types.ObjectId,
    ref: "Community",
  },
  createdBy: {
    type: String,
    required: true,
  },
  comments: [
    {
      user: {
        type: String,
      },
      text: {
        type: String,
        required: true,
      },
      createdOn: {
        type: Date,
        default: new Date(),
      },
      attachments: [{
        type: {
          type:String
        },
        path: String
      }],
      commentEmojis: {
        likes: [String],
        dislikes: [String],
        applauds: [String]
      },
      profilePic: String
    },
  ],
  tags: [String],
  expiryDate: {
    type: Date,
  },
  createdOn: {
    type: Date,
    default: new Date(),
  },
  postEmojis: {
    likes: [String],
    dislikes: [String],
    applauds: [String]
  },
  attachments: [{
    type: {
      type:String
    },
    path: String
  }],
  isActive: Boolean
});

module.exports = model("Post", postsSchema);
