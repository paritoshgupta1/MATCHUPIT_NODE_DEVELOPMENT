const sendResponse = require('../helpers/response_handler').sendResponse;
const corporateService = require('../services/corporate');




const searchCorporates = async (req, res) => {
    try {
        const serviceResponse = await corporateService.searchCorporate(req, res)
        return sendResponse(serviceResponse, res)
    } catch (ex) {
        console.log(ex)
        return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching corporates', err_stack: ex.stack }, res)
    }
}

const getRecentSearch = async (req, res) => {
    try {
      const serviceResponse = await corporateService.getRecentSearch(req)
      return sendResponse(serviceResponse, res)
    } catch (ex) {
      console.log(ex)
      return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching recents', err_stack: ex.stack }, res)
    }
  }
  
  const getRecentProfile = async (req, res) => {
    try {
      const serviceResponse = await corporateService.getRecentProfile(req)
      return sendResponse(serviceResponse, res)
    } catch (ex) {
      console.log(ex)
      return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching recents', err_stack: ex.stack }, res)
    }
  }
  
  const getPopularProfile = async (req, res) => {
    try {
      const serviceResponse = await corporateService.getPopularProfile(req)
      return sendResponse(serviceResponse, res)
    } catch (ex) {
      console.log(ex)
      return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching user profile', err_stack: ex.stack }, res)
    }
  }
  
  const getPopularText = async (req,res) => {
    try {
      const serviceResponse = await corporateService.getPopularText(req)
      return sendResponse(serviceResponse,res)
    } catch(ex) {
      console.log(ex)
      return sendResponse({err: true, responseCode: 500, msg: 'Error in fetching popular searchtext', err_stack: ex.stack },res)
    }
  }

const trackProfileVisit = async (req, res) => {
    try {
        const serviceResponse = await corporateService.trackProfileVisit(req)
        return sendResponse(serviceResponse, res)
    } catch (ex) {
        console.log(ex)
        return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching corporate profile', err_stack: ex.stack }, res)
    }
}

const searchCorporatesForMap = async (req, res) => {
    try {
        const serviceResponse = await corporateService.searchCorporate(req, res, true)
        return sendResponse(serviceResponse, res)
    } catch (ex) {
        console.log(ex)
        return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching corporates', err_stack: ex.stack }, res)
    }
}

const tagUser = async (req, res) => {
    try {
        const serviceResponse = await corporateService.tagUser(req, res)
        return sendResponse(serviceResponse, res)
    } catch (ex) {
        console.log(ex)
        return sendResponse({ err: true, responseCode: 500, msg: 'Error in tagging user', err_stack: ex.stack }, res)
    }
}


const addCorporateMember = async (req, res) => {
  try {
      const serviceResponse = await corporateService.addCorporateMember(req, res)
      return sendResponse(serviceResponse, res)
  } catch (ex) {
      console.log(ex)
      return sendResponse({ err: true, responseCode: 500, msg: 'Error in add corporate user', err_stack: ex.stack }, res)
  }
}

const removeCorporateMember = async (req, res) => {
  try {
      const serviceResponse = await corporateService.removeCorporateMember(req, res)
      return sendResponse(serviceResponse, res)
  } catch (ex) {
      console.log(ex)
      return sendResponse({ err: true, responseCode: 500, msg: 'Error in removing corporate user', err_stack: ex.stack }, res)
  }
}

const getTaggedUsers = async (req, res) => {
  try {
      const serviceResponse = await corporateService.getTaggedUsers(req, res)
      return sendResponse(serviceResponse, res)
  } catch (ex) {
      console.log(ex)
      return sendResponse({ err: true, responseCode: 500, msg: 'Error in removing corporate user', err_stack: ex.stack }, res)
  }
}

module.exports = {
    searchCorporates,
    trackProfileVisit: trackProfileVisit,
    getRecentSearch: getRecentSearch,
    getRecentProfile: getRecentProfile,
    getPopularProfile: getPopularProfile,
    getPopularText: getPopularText,
    searchCorporatesForMap,
    tagUser,
    addCorporateMember,
    removeCorporateMember,
    getTaggedUsers

}