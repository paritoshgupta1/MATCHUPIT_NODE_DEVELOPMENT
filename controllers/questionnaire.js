const questionnaireService = require('../services/questionnaire')
const sendResponse = require('../helpers/response_handler').sendResponse
const _ = require('lodash')

const addQuestionnaire = async (req, res) => {
  const questionnairePayload = req.body
  if (!_.isArray(questionnairePayload)) {
    sendResponse({ err: true, responseCode: 400, msg: 'Questionnaire must be an array' }, res)
  }
  try {
    const serviceResponse = await questionnaireService.addQuestionnaire(questionnairePayload)
    sendResponse({ err: false, responseCode: 200, msg: 'Questionnaire successfully added' }, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in adding questionnaire', err_stack: ex.stack }, res)
  }
}

const getQuestionnaire = async (req, res) => {
  try {
    const serviceResponse = await questionnaireService.getQuestionnaire(req.tokenUser.data.id)
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in getting questionnaire', err_stack: ex.stack }, res)
  }
}

module.exports = {
  addQuestionnaire: addQuestionnaire,
  getQuestionnaire: getQuestionnaire
}
