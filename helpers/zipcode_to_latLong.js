const rp = require('request-promise')
const _ = require('lodash')
require('dotenv').config()
const zipcodeToLatlong = async (zipcode) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${process.env.GOOGLE_API_KEY}`
  const result = await rp(url)
  const latLng = _.get(JSON.parse(result), "results[0].geometry.location")
  return latLng
}

module.exports = zipcodeToLatlong
