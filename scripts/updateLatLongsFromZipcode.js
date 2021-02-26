require('dotenv').config()
require('../db/index')
const User = require('../models/user')
const Corporate = require('../models/corporate')
const zipcodeToLatLong = require('../helpers/zipcode_to_latLong')
const Op = require('sequelize').Op
const _ = require('lodash')
console.log('Waiting.....')

function updateLatLongsFromZipCode () {
  const p1 = User.findAll({
    where: {
      latitude: {
        [Op.eq]: null
      },
      zipcode: {
        [Op.ne]: null
      }
    }
  })

  const p2 = Corporate.findAll({
    where: {
      latitude: {
        [Op.eq]: null
      },
      zipcode: {
        [Op.ne]: null
      }
    }
  })

  Promise.all([p1, p2])
    .then(async (results) => {
      let users, corporates
      users = _.map(results[0], 'dataValues')
      for (let i = 0; i < users.length; i++) {
        const user = users[i]
        try {
          const result = await zipcodeToLatLong(user.zipcode)
          await User.update({ latitude: result.lat, longitude: result.lng }, { where: { id: user.id } })
          console.log(`lat longs for the user ${user.id} has been updated`)
        } catch (ex) {
          console.log(`error occured for the user ${user.id}`)
          console.log(ex)
        }
      }
      corporates = _.map(results[1], 'dataValues')
      for (let i = 0; i < corporates.length; i++) {
        const corporate = corporates[i]
        try {
          const result = await zipcodeToLatLong(corporate.zipcode)
          await Corporate.update({ latitude: result.lat, longitude: result.lng }, { where: { id: corporate.id } })
          console.log(`lat longs for the user ${corporate.id} has been updated`)
        } catch (ex) {
          console.log(`error occured for the user ${corporate.id}`)
          console.log(ex)
        }
      }
    }).catch((ex) => {
      console.log('Error in script execution')
      console.log(ex)
    }).then(() => {
      console.log('Done!!')
      process.exit(0)
    })
}

console.log('PLEASE WAIT...')
setTimeout(() => {
  updateLatLongsFromZipCode()
}, 3000)
