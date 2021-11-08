const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const communitySchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  }, 
  roles: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  userCount: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true
  },
  createdOn: {
    type: Date,
    default: new Date(),
  },
});

module.exports = model("Community", communitySchema);
