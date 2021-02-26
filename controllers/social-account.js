const socialAccountService = require('../services/social-account')
const sendResponse = require('../helpers/response_handler').sendResponse
const socialAccountHandler = async (req, res) => {
  const userPayload = req.body
  try {
    const serviceResponse = await socialAccountService.socialAccountHandler(userPayload)
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in Handling social account', err_stack: ex.stack }, res)
  }
}

module.exports = {
  socialAccountHandler: socialAccountHandler
}
