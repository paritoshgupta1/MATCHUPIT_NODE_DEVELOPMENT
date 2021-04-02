const adminService = require('../services/admin')
const sendResponse = require('../helpers/response_handler').sendResponse
const _get = require('lodash').get
const bcrypt = require("bcryptjs");
const model = require('../models/index');
const generateJWT = require('../helpers/jwt').generateJWT;
const responseObj = require('../helpers/response_handler').responseObj;
const User = require('../models/user')
const Corporate = require('../models/corporate');
const hashHandler = require('../helpers/hash_handler')
const { Op } = require('sequelize');
const { update } = require('lodash');

const adminLogin = async (req, res) => {
    if (!req.body.email || !req.body.password) {
      sendResponse(
        { err: true, responseCode: 400, msg: "email and password are mandatory" },
        res
      );
    }
    let email = req.body.email.trim();
    let password = req.body.password.trim();
  
    try {
      let user = await User.findOne({
        where: { email },
        attributes: ["id", "email", "password", "account_type"],
      });
      if (!user) {
        return res.status(401).json({
          err: true,
          msg: "User not registered",
        });
      }
      const adminuserId = user.id;
      if(user.account_type != 'admin' && !adminuserId.startsWith('admin-'))
      {
        return res.status(401).json({
          err: true,
          msg: "User is not an administrator",
        });
      }
      const userObj = {};
  
      const handlerResponse = await hashHandler;
      const compareHash = handlerResponse.compareHash;
      const match = compareHash(user.dataValues.password, password);
  
      if (!match) {
        return res.status(401).json({
          err: true,
          msg: "Incorrect password",
        });
      }
      userObj.token = generateJWT({
        email: req.body.email,
        id: user.dataValues.id,
        account_type: user.dataValues.account_type,
      });
      userObj.email = req.body.email;
      userObj.id = user.dataValues.id;
      userObj.account_type = user.dataValues.account_type;
      return res.status(200).json({
        err: false,
        statusCode: 200,
        userObj,
      });
    } catch (ex) {
      console.log(ex);
      return res.status(500).json({
        err: true,
        msg: "Error in logging in admin",
      });
    }
  };

const countUsers = async (req, res) => {
    try {
        let serviceResponse = await adminService.countUsers(req)
        return sendResponse(serviceResponse, res)
    } catch (ex) {
        console.log(ex)
        return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching user data (count)', err_stack: ex.stack}, res)
    }
}

const paymentStatus = async (req,res) => {
    try{
        let serviceResponse = await adminService.paymentStatus(req)
        return sendResponse(serviceResponse, res)
    } catch (ex) {
        console.log(ex)
        return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching payment data (count)', err_stack: ex.stack}, res)
    }
}

const updateSchema = async (req,res) => {
  try {
    let serviceResponse = await adminService.updateSchema(req)
        return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in updating schema', err_stack: ex.stack}, res)
}
}


const getRevenue = async (req, res) => {
  try {
    let serviceResponse = await adminService.getRevenue(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in updating schema', err_stack: ex.stack}, res)
  }
}

const getAboutToExpireUsers = async (req, res) => {
  try {
    let serviceResponse = await adminService.getAboutToExpireUsers(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in updating schema', err_stack: ex.stack}, res)
  }
}

const getReport = async (req, res) => {
  try {
    let serviceResponse = await adminService.getReport(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in getting report', response: {}, err_stack: ex.stack}, res)
  }
}


const cronJob = async (req, res) => {
  try {
    let serviceResponse = await adminService.cronJob(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in getting report', response: {}, err_stack: ex.stack }, res)
  }
}

module.exports = {
  adminLogin: adminLogin,
  countUsers: countUsers,
  paymentStatus: paymentStatus,
  updateSchema: updateSchema,
  getRevenue,
  getAboutToExpireUsers,
  getReport: getReport,
  cronJob
}