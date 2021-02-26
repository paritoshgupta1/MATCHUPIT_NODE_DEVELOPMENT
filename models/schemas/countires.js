const mongoose = require('../../db').mongoose

const schema = new mongoose.Schema({
  _id: mongoose.SchemaTypes.String,
  CountryList: mongoose.SchemaTypes.Mixed
}, { versionKey: false })

const Countries = mongoose.model('countries', schema)

module.exports = Countries
