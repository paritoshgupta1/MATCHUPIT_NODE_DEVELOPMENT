const userService = require('../services/user')
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
const UserProfile = require('../models/schemas/user_profiles')
const Cryptr = require('cryptr');
const cryptr = new Cryptr('7a51e7ac-7504-4158-95d3-b3f023c51534');

const signup = async (req, res) => {

  if (req.body.authorization && req.body.password) {

    const decryptedPayload = JSON.parse(cryptr.decrypt(req.body.authorization));

    if (!['corporate', 'individual'].includes(decryptedPayload.account_type)) {
      sendResponse({ err: true, responseCode: 400, msg: 'allowed value for account_type is corporate/individual' }, res)
    }

    let checkMembers = await model.corporatemastermapping.findAll({ where: { corporateId: decryptedPayload.corporateId, is_active: true }, raw: true });

    console.log('In register', checkMembers.length)
    if (checkMembers.length >= 4) {
      return sendResponse({ err: true, responseCode: 400, msg: 'User cannot be registered due to the limit exceeds' }, res)
    }

    const payload = {
      email: decryptedPayload.email,
      password: req.body.password,
      account_type: decryptedPayload.account_type,
      corporateId: decryptedPayload.corporateId
    }

    try {
      const serviceResponse = await userService.signup(payload)
      sendResponse(serviceResponse, res)
    } catch (ex) {
      console.log(ex)
      sendResponse({ err: true, responseCode: 500, msg: 'Error in signing up', err_stack: ex.stack}, res)
    }

  }
  else {

    if (!req.body.email || !req.body.password || !req.body.account_type) {
      sendResponse({ err: true, responseCode: 400, msg: 'email, password and account_type are mandatory' }, res)
    }

    if (!['corporate', 'individual'].includes(req.body.account_type)) {
      sendResponse({ err: true, responseCode: 400, msg: 'allowed value for account_type is corporate/individual' }, res)
    }
    const payload = {
      email: req.body.email,
      password: req.body.password,
      account_type: req.body.account_type,
      corporateId: req.body.corporateId
    }
    try {
      const serviceResponse = await userService.signup(payload)
      sendResponse(serviceResponse, res)
    } catch (ex) {
      console.log(ex)
      sendResponse({ err: true, responseCode: 500, msg: 'Error in signing up', err_stack: ex.stack}, res)
    }
  }

}

const login = async (req, res) => {

  if (req.body.authorization) {
    try {

      const decryptedPayload = JSON.parse(cryptr.decrypt(req.body.authorization));

      let checkMembers = await model.corporatemastermapping.findAll({ where: { corporateId: decryptedPayload.corporateId, is_active: true }, raw: true });
      if (checkMembers.length >= 4) {
        return sendResponse({ err: true, responseCode: 400, msg: 'User cannot be signin due to the limit exceeds' }, res)
      }
      console.log('In Login', checkMembers.length)
      await model.corporatemastermapping.update({ is_active: true }, { where: { corporateId: decryptedPayload.corporateId, email: decryptedPayload.email } });

      const payload = {
        email: decryptedPayload.email,
        password: req.body.password,
        account_type: decryptedPayload.account_type && decryptedPayload.account_type
      };
      let user;
      user = await User.findOne({ where: { email: payload.email } });
      if (!user) {
        user = await Corporate.findOne({ where: { email: payload.email } })
      }
      if (!user) {
        return responseObj(true, 401, 'User not registered')
      }
      const userObj = {};
      user = user.dataValues


      userObj.token = generateJWT({ email: user.email, id: user.id, email_verified: user.email_verified, account_type: 'corporate' });
      userObj.email = user.email;
      userObj.id = user.id;
      userObj.email_verified = user.email_verified;
      userObj.account_type = "corporate";

      return res.status(200).json({
        err: false,
        responseCode: 200,
        msg: 'Login Success',
        response: userObj
      })
    }
    catch (ex) {
      console.log(ex)
      return responseObj(true, 500, 'Error in logging in')
    }

  }
  else {

    if (!req.body.email || !req.body.password) {
      sendResponse({ err: true, responseCode: 400, msg: 'email and password are mandatory' }, res)
    }

    const payload = {
      email: req.body.email,
      password: req.body.password,
      account_type: req.body.account_type && req.body.account_type
    };
    try {
      const serviceResponse = await userService.login(payload)
      sendResponse(serviceResponse, res)
    } catch (ex) {
      console.log(ex)
      sendResponse({ err: true, responseCode: 500, msg: 'Error in logging in', err_stack: ex.stack}, res)
    }
  }
}

const switchAccount = async (req, res) => {
  try {
    const serviceResponse = await userService.switchAccount(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in switching account', err_stack: ex.stack}, res)
  }
}

const updateUserProfile = async (req, res) => {
  const paramUserId = req.params.id
  const tokenUserId = _get(req.tokenUser, 'data.id')
  if (paramUserId !== tokenUserId) {
    return sendResponse({ err: true, responseCode: 401, msg: 'Invalid user id' }, res)
  }
  const tokenAccountType = _get(req.tokenUser, 'data.account_type')
  const payload = req.body
  try {
    if (tokenAccountType === 'individual') {
      if (!payload.basic_details && !payload.certifications &&
      !payload.work_experience && !payload.user_consent &&
      !payload.additional_info && !payload.education &&
      !payload.personal_details && !payload.media && !payload.social_links  && !payload.board_experience) {
        return sendResponse({ err: true, responseCode: 401, msg: 'Any one of basic_details, education, certifications, work_experience, user_consent, additional_info, personal_details, media, social_links, board_experience is mandatory' }, res)
      }
    } else if (tokenAccountType === 'corporate') {
      if (!payload.basic_details && !payload.additional_info && !payload.media) {
        return sendResponse({ err: true, responseCode: 401, msg: 'Any one of basic_details, additional_info, media is mandatory' }, res)
      }
    }
    const serviceResponse = await userService.updateUserProfile(payload, tokenUserId, tokenAccountType)
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in updating the profile', err_stack: ex.stack}, res)
  }
}

const getUserProfile = async (req, res) => {
  const paramUserId = req.params.id
  if (!paramUserId) {
    return sendResponse({ err: true, responseCode: 400, msg: 'User id is missing' }, res)
  }
  const tokenUserId = _get(req.tokenUser, 'data.id')
  const tokenUserAccountType = _get(req.tokenUser, 'data.account_type')
  if (paramUserId !== tokenUserId) {
    return sendResponse({ err: true, responseCode: 401, msg: 'Invalid user id' }, res)
  }

  try {
    const serviceResponse = await userService.getUserProfile(tokenUserId, tokenUserAccountType)
    sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in getting user profile', err_stack: ex.stack}, res)
  }
}

const sendEmailOTP = async (req, res) => {
  try {
    // const paramUserId = req.params.id
    const inputEmail = req.query.email
    // if (!paramUserId) {
    //   return sendResponse({ err: true, responseCode: 400, msg: 'User id is missing' }, res)
    // }
    if (!inputEmail) {
      return sendResponse({ err: true, responseCode: 400, msg: 'email is missing' }, res)
    }
    // const tokenUserId = _get(req.tokenUser, 'data.id')
    // const tokenUserAccountType = _get(req.tokenUser, 'data.account_type')
    // if (paramUserId !== tokenUserId) {
    //   return sendResponse({ err: true, responseCode: 401, msg: 'Invalid user id' }, res)
    // }
    const serviceResponse = await userService.sendEmailOTP(inputEmail);
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in sending OTP', err_stack: ex.stack }, res)
  }
}

const verifyEmailOTP = async (req, res) => {
  try {
    // const paramUserId = req.params.id
    const inputOTP = req.query.otp
    const inputEmail = req.query.email
    
    if (!inputEmail) {
      return sendResponse({ err: true, responseCode: 400, msg: 'Email is missing' }, res)
    }
    if (!inputOTP) {
      return sendResponse({ err: true, responseCode: 400, msg: 'otp is missing' }, res)
    }
    // const tokenUserId = _get(req.tokenUser, 'data.id')
    // const tokenUserAccountType = _get(req.tokenUser, 'data.account_type')
    // if (paramUserId !== tokenUserId) {
    //   return sendResponse({ err: true, responseCode: 401, msg: 'Invalid user id' }, res)
    // }
    const serviceResponse = await userService.verifyEmailOTP(inputOTP, inputEmail);
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in sending OTP', err_stack: ex.stack}, res)
  }
}

const changePassword = async (req, res) => {
  try {
    const paramUserId = req.params.id
    const oldPass = req.body.oldPassword
    const newPass = req.body.newPassword
    if (!oldPass || !newPass) {
      return sendResponse({ err: true, responseCode: 400, msg: 'oldPassword & newPassowrd are mandatory'}, res)
    }
    const tokenUserId = _get(req.tokenUser, 'data.id')
    const tokenUserAccountType = _get(req.tokenUser, 'data.account_type')
    if (paramUserId !== tokenUserId) {
      return sendResponse({ err: true, responseCode: 401, msg: 'Invalid user id' }, res)
    }
    const serviceResponse = await userService.changePassword(oldPass, newPass, tokenUserId, tokenUserAccountType)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in changing password', err_stack: ex.stack}, res)
  }
}

const sendForgotPasswordOTP = async (req, res) => {
  try {
    const inputEmail = req.query.email
    if (!inputEmail) {
      return sendResponse({ err: true, responseCode: 400, msg: 'query params email is missing' }, res)
    }
    const serviceResponse = await userService.sendForgotPasswordOTP(inputEmail)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in sending OTP', err_stack: ex.stack}, res)
  }
}

const forgotPassword = async (req, res) => {
  try {
    const inputEmail = req.body.email
    const newPassword = req.body.new_password
    const inputOTP = req.body.otp
    if (!newPassword || !inputEmail || !inputOTP) {
      return sendResponse({ err: true, responseCode: 400, msg: 'email, otp, new_passowrd are mandatory'}, res)
    }
    const serviceResponse = await userService.forgotPassword(inputEmail, inputOTP, newPassword)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in changing password', err_stack: ex.stack}, res)
  }
}

const checkUser = async (req, res) => {
  try {
    const inputEmail = req.query.email
    if (!inputEmail) {
      return sendResponse({ err: true, responseCode: 400, msg: 'query params email is mandatory' }, res)
    }
    const serviceResponse = await userService.checkUser(inputEmail)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in getting status', err_stack: ex.stack}, res)
  }
}

const getSalary = async (req, res) => {
  try {
    const userid = req.headers.userid
    if (!userid) {
      return sendResponse({ err: true, responseCode: 400, msg: 'user id is missing' }, res)
    }
    const serviceResponse = await userService.getSalary(userid)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in getting salary', err_stack: ex.stack}, res)
  }
}

const searchUsers = async (req, res) => {
  try {
    const serviceResponse = await userService.searchUsers(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching users', err_stack: ex.stack}, res)
  }
}

const trackUserProfileVisit = async (req, res) => {
  try {
    const serviceResponse = await userService.trackProfileVisit(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching user profile', err_stack: ex.stack}, res)
  }
}

const getRecentSearch = async (req, res) => {
  try {
    const serviceResponse = await userService.getRecentSearch(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching recents', err_stack: ex.stack}, res)
  }
}

const getRecentSearchInd = async (req, res) => {
  try {
    const serviceResponse = await userService.getRecentSearchInd(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching recents', err_stack: ex.stack}, res)
  }
}

const getPopularSearch = async (req, res) => {
  try {
    const serviceResponse = await userService.getPopularSearch(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching user profile', err_stack: ex.stack}, res)
  }
}

const getPopularSearchText = async (req,res) => {
  try {
    const serviceResponse = await userService.getPopularSearchText(req)
    return sendResponse(serviceResponse,res)
  } catch(ex) {
    console.log(ex)
    return sendResponse({err: true, responseCode: 500, msg: 'Error in fetching popular searchtext', err_stack: ex.stack},res)
  }
}

const searchUsersForMap = async (req, res) => {
  try {
    const serviceResponse = await userService.searchUsers(req, res, true)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in fetching users', err_stack: ex.stack}, res)
  }
}


const getUsers = async (req, res) => {
  let { searchText, accounType } = req.query;

  if (!searchText || !accounType) {
    return sendResponse(
      {
        err: true,
        responseCode: 400,
        msg: "Searchtext, Account type are mandatory",
      },
      res
    );
  }
  try {
    if (accounType === "individual") {
      let users1 = await User.findAll({
        where: {
          account_type: "individual",
          [Op.or]: [
            {
              first_name: {
                [Op.like]: `%${searchText}%`,
              },
            },
            {
              last_name: {
                [Op.like]: `%${searchText}%`,
              },
            },
          ],
        },
        attributes: ["id", "first_name", "last_name", "profile_pic", "available_hire"],
      });

      if (users1.length > 0) {
        users1 = JSON.parse(JSON.stringify(users1));

        let users = users1.map((user) => ({
          ...user,
          name: user.first_name + " " + user.last_name,
        }));



        return sendResponse(
          {
            err: false,
            responseCode: 200,
            users,
          },
          res
        );
      } else {
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            msg: "No users found",
          },
          res
        );
      }
    } else if (accounType === "corporate") {
      let corporates1 = await Corporate.findAll({
        where: {
          name: {
            [Op.like]: `%${searchText}%`,
          },
        },
        attributes: ["id", "name", "logo"],
      });

      if (corporates1.length > 0) {
        corporates1 = JSON.parse(JSON.stringify(corporates1));
        let corporates = corporates1.map((corporate) => ({
          ...corporate,
          profile_pic: corporate.logo,
        }));

        return sendResponse(
          {
            err: false,
            responseCode: 200,
            users: corporates,
          },
          res
        );
      } else {
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            msg: "No users found",
          },
          res
        );
      }
    } else {
      let users1 = await User.findAll({
        where: {
          account_type: "individual",
          [Op.or]: [
            {
              first_name: {
                [Op.like]: `%${searchText}%`,
              },
            },
            {
              last_name: {
                [Op.like]: `%${searchText}%`,
              },
            },
          ],
        },
        attributes: ["id", "first_name", "last_name", "profile_pic"],
      });

      users1 = JSON.parse(JSON.stringify(users1));
      const userData = users1.map((user) => ({
        ...user,
        name: user.first_name + " " + user.last_name,
      }));

      let corporates1 = await Corporate.findAll({
        where: {
          name: {
            [Op.like]: `%${searchText}%`,
          },
        },
        attributes: ["id", "name", "logo"],
      });

      corporates1 = JSON.parse(JSON.stringify(corporates1));
      let corporates = corporates1.map((corporate) => ({
        ...corporate,
        profile_pic: corporate.logo,
      }));

      let users = [...userData, ...corporates];

      if (users.length > 0) {
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            users,
          },
          res
        );
      } else {
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            msg: "No users found",
          },
          res
        );
      }
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in getting users",
        err_stack: ex.stack
      },
      res
    );
  }
};


const getUserByID = async (req, res) => {
  if (!req.query.userId) {
    sendResponse(
      { err: true, responseCode: 400, msg: "userId is mandatory" },
      res
    );
  }

  try {
    let userObj1 = await User.findOne({
      where: { id: req.query.userId },
      attributes: ["id", "email", "title", "first_name", "last_name", "phone", "country_name", "address_line", "state", "city", "citizenship", "dob", "gender", "profile_pic", "latitude", "longitude", "is_student"],
    });
    if (!userObj1) {
      return res.status(200).json({
        err: true,
        msg: "User not registered",
      });
    }

    let userObj = JSON.parse(JSON.stringify(userObj1))

    const userProfile = await UserProfile.findById(req.query.userId, { '_id': 0 })

    let mongoProfile = JSON.parse(JSON.stringify(userProfile))

    if (mongoProfile) {
      userObj = { ...userObj, ...mongoProfile }
    }

    return res.status(200).json({
      err: false,
      responseCode: 200,
      userObj,
    });
  } catch (ex) {
    console.log(ex);
    return res.status(500).json({
      err: true,
      msg: "Error in getting user data",
    });
  }
};

const deactivateAccount = async (req,res) => {
  try {
    const serviceResponse = await userService.deactivateAccount(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in deactivation",
        err_stack: ex.stack,
      },
      res
    );
  }
};

const updateEmail = async (req, res) => {
  try {
    if (!req.body.email || !req.body.type) {
      sendResponse(
        { err: true, responseCode: 400, msg: "email and type are mandatory" },
        res
      );
    }
    const serviceResponse = await userService.updateEmail(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in deactivation",
        err_stack: ex.stack,
      },
      res
    );
  }
};

const recoveryVerify = async (req, res) => {
  try {
    // const paramUserId = req.params.id
    const inputOTP = req.query.otp
    const inputEmail = req.query.email
    const r = req.query.r || true;
    if (r && !req.headers['userid']) {
      return sendResponse({ err: true, responseCode: 400, msg: 'Token is missing' }, res)
    }
    if (!inputEmail) {
      return sendResponse({ err: true, responseCode: 400, msg: 'Email is missing' }, res)
    }
    if (!inputOTP) {
      return sendResponse({ err: true, responseCode: 400, msg: 'otp is missing' }, res)
    }
    // const tokenUserId = _get(req.tokenUser, 'data.id')
    // const tokenUserAccountType = _get(req.tokenUser, 'data.account_type')
    // if (paramUserId !== tokenUserId) {
    //   return sendResponse({ err: true, responseCode: 401, msg: 'Invalid user id' }, res)
    // }
    const serviceResponse = await userService.recoveryVerify(inputOTP, inputEmail, r, req.tokenUser);
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex)
    return sendResponse({ err: true, responseCode: 500, msg: 'Error in sending OTP', err_stack: ex.stack}, res)
  }
}


const getUserData = async (req, res) => {
  try {
    if (!req.body.userIds || !req.body.userIds.length > 0) {
      sendResponse(
        { err: true, responseCode: 400, msg: "User Ids are mandatory" },
        res
      );
    }
    const serviceResponse = await userService.getUserData(req)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in deactivation",
        err_stack: ex.stack,
      },
      res
    );
  }
};

const downloadPdf = async (req, res) => {
  try {
    if (!req.body.content) {
      sendResponse(
        { err: true, responseCode: 400, msg: "content is mandatory" },
        res
      );
    }
    const serviceResponse = await userService.downloadPdf(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in deactivation",
        err_stack: ex.stack,
      },
      res
    );
  }
};


const getUserJobDetails = async (req, res) => {
  try {
    const serviceResponse = await userService.getUserJobDetails(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in getUserJobDetails",
        err_stack: ex.stack,
      },
      res
    );
  }
};


const addUserJobDetails = async (req, res) => {
  try {
    const serviceResponse = await userService.addUserJobDetails(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in addUserJobDetails",
        err_stack: ex.stack,
      },
      res
    );
  }
};


const updateUserJobDetails = async (req, res) => {
  try {
    const serviceResponse = await userService.updateUserJobDetails(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in updateUserJobDetails",
        err_stack: ex.stack,
      },
      res
    );
  }
};

const sendInviteMail = async(req, res) => {
  try {
    const serviceResponse = await userService.sendInviteMail(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in Sending mail",
        err_stack: ex.stack,
      },
      res
    );
  }

};

const getJobTypes = async (req, res) => {
  try {
    const serviceResponse = await userService.getJobTypes(req, res)
    return sendResponse(serviceResponse, res)
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "Error in getJobTypes",
        err_stack: ex.stack,
      },
      res
    );
  }
};

module.exports = {
  signup: signup,
  login: login,
  switchAccount: switchAccount,
  updateUserProfile: updateUserProfile,
  getUserProfile: getUserProfile,
  sendEmailOTP: sendEmailOTP,
  verifyEmailOTP: verifyEmailOTP,
  changePassword: changePassword,
  sendForgotPasswordOTP: sendForgotPasswordOTP,
  forgotPassword: forgotPassword,
  getSalary: getSalary,
  trackUserProfileVisit: trackUserProfileVisit,
  getRecentSearch: getRecentSearch,
  getRecentSearchInd: getRecentSearchInd,
  getPopularSearch: getPopularSearch,
  getPopularSearchText: getPopularSearchText,
  searchUsers: searchUsers,
  searchUsersForMap: searchUsersForMap,
  checkUser: checkUser,
  getUsers,
  getUserByID,
  deactivateAccount: deactivateAccount,
  updateEmail,
  recoveryVerify,
  getUserData,
  downloadPdf,
  getUserJobDetails,
  addUserJobDetails,
  updateUserJobDetails,
  getJobTypes,
  sendInviteMail
}
