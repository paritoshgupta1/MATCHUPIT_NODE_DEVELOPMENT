const industryService = require('../services/industry')
const sendResponse = require('../helpers/response_handler').sendResponse
const _ = require('lodash')

const getIndustryInfo = async (req, res) => {
  try {
    const serviceResponse = await industryService.getIndustryInfo()
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in getting info', err_stack: ex.stack }, res)
  }
}

module.exports = {
  getIndustryInfo: getIndustryInfo
}
