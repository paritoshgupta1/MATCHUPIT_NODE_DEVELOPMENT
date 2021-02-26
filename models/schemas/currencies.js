const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const schema = Schema({
    _id: mongoose.SchemaTypes.String,
    CurrencyList: mongoose.SchemaTypes.Mixed
  }, { versionKey: false })

module.exports = model("currencies", schema);
