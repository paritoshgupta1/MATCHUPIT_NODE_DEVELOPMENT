const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  industries: [mongoose.SchemaTypes.String]
}, { versionKey: false })

const Industries = mongoose.model('industries', schema)

module.exports = Industries
