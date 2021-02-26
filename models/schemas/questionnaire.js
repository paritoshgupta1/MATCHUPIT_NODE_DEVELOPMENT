const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  _id: mongoose.SchemaTypes.String,
  isAnswered: { type: mongoose.SchemaTypes.Number, default: 0 },
  question: mongoose.SchemaTypes.String,
  response_type: mongoose.SchemaTypes.String,
  options: mongoose.SchemaTypes.Mixed,
  instructions: mongoose.SchemaTypes.String,
  category_name: mongoose.SchemaTypes.String,
  sequence_no: mongoose.SchemaTypes.Number,
  isActive: { type: mongoose.SchemaTypes.Number, default: 1 },
  name: mongoose.SchemaTypes.String,
  meta: mongoose.SchemaTypes.Mixed
}, { versionKey: false })

const Questionnaire = mongoose.model('questionnaire', schema)

module.exports = Questionnaire
