const Payments = require('../models/schemas/payments')
const responseObj = require('../helpers/response_handler').responseObj
const User = require('../models/user')
const Corporate = require('../models/corporate')
const _ = require('lodash')

async function savePaymentDetails (userId, paymentDetails) {
  try {
    await Payments.insertMany([{ user_id: userId, details: paymentDetails, time_stamp: new Date() }])
    if (userId.startsWith('c-')) { // for corporate account
      await Corporate.update({ payment_status: paymentDetails.status }, { where: { id: userId } })
    } else {
      await User.update({ payment_status: paymentDetails.status }, { where: { id: userId } })
    }
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in in saving payment details',{err_stack: ex.stack})
  }
}

module.exports = {
  savePaymentDetails: savePaymentDetails
}
