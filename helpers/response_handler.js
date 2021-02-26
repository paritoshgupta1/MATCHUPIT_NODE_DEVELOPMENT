const logger = require('./logger')

function responseObj (err, responseCode, msg, data) {
  return {
    err: err,
    responseCode: responseCode,
    msg: msg,
    response: data
  }
}
function sendResponse (responseObj, res) {
  try {
    if(responseObj.responseCode != 200) {
      if(!responseObj.response)
        responseObj.response = {}
      if(!responseObj.err_stack)
        responseObj.err_stack = ""
      if(responseObj.response.err_stack) {
        responseObj.err_stack = responseObj.response.err_stack
        delete responseObj.response.err_stack
      }
      logger.error({err: responseObj.err,
      responseCode: responseObj.responseCode,
      msg: responseObj.msg, payload: responseObj.response, error_stack: responseObj.err_stack})
    }
    res.status(responseObj.responseCode).send(responseObj)
  } catch (ex) {
    console.log('Error in sending response.....')
    logger.error({err: true,
      responseCode: 500,
      msg: 'Error in sending response.....', payload: {}, error_stack: ex.stack})
    res.status(500).send({ msg: 'Internal Server Error' })
  }
}

module.exports = {
  responseObj: responseObj,
  sendResponse: sendResponse
}
