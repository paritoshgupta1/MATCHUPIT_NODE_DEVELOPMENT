const countriesService = require('../services/countries')
const sendResponse = require('../helpers/response_handler').sendResponse

const getCountries = async (req, res) => {
  try {
    const serviceResponse = await countriesService.getCountries()
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in getting questionnaire', err_stack: ex.stack }, res)
  }
}

module.exports = {
  getCountries: getCountries
}
