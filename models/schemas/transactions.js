const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const transactionSchema = new mongoose.Schema({
    user_id: mongoose.SchemaTypes.String,
    time_stamp: mongoose.SchemaTypes.Date,
    details: mongoose.SchemaTypes.Mixed
  }, { versionKey: false })
  

module.exports = model("Transaction", transactionSchema);