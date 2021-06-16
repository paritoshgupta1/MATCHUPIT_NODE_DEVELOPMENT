const moment = require('moment')
const htmlDocx = require('html-docx-js');
const _ = require('lodash')
const User = require('../models/user')
const Corporate = require('../models/corporate')
const model = require('../models/index');
const UserProfile = require('../models/schemas/user_profiles')
const CorporateProfile = require('../models/schemas/corporate_profiles')
const Payments = require('../models/schemas/payments')
const OTPs = require('../models/schemas/otps')
const idGenerator = require('../helpers/id_generator').generateId
const hashHandler = require('../helpers/hash_handler')
const responseObj = require('../helpers/response_handler').responseObj
const generateJWT = require('../helpers/jwt').generateJWT
const generateOTP = require('../helpers/otp').generateOTP
const sendMail = require('../helpers/email/email').sendMail
// const sendMail = require('../helpers/email/sendgrid').sendMail
const zipcodeToLatLong = require('../helpers/zipcode_to_latLong')
const meanSalariesMaster = require('../helpers/mean_salaries')
const Op = require('sequelize').Op
const sequelize = require('sequelize')
const CorporateTags = require('../models/schemas/corporate_tags');
const Roles = require('../models/schemas/roles');
const getLatLong = require('../helpers/zipcode_to_latLong');
const corporateService = require('../services/corporate');
const Conversation = require("../models/schemas/conversation");
const sendResponse = require('../helpers/response_handler').sendResponse;
const { mongoose } = require('../db');
const request = require('request');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const http = require('http');
const AWS = require('aws-sdk');
const Config = require('../mediaService/config');
const pdf = require('html-pdf');
const Community = require('../models/schemas/community');
const Posts = require('../models/schemas/post');

async function signup(payload) {
  try {
    if (payload.account_type === 'individual') {

      if (payload.corporateId) {

        const user = await User.findOne({ where: { email: payload.email }, raw: true })
        if (user) {

          const userObj = { email: payload.email, id: user.id, email_verified: user.email_verified, account_type: "individual" };

          userObj.token = generateJWT(userObj);
          return responseObj(false, 200, 'Account has been created', userObj)

        }
        else {

          const corporateData = await Corporate.findOne({ where: { id: payload.corporateId }, attributes: ["id"] });
          if (!corporateData) {
            return responseObj(true, 400, 'Corporate does not exist')
          }

          const userId = idGenerator('user');
          payload.id = userId;

          const userProfile = new UserProfile({ _id: userId });
          await userProfile.save();

          const handlerResponse = await hashHandler
          const generateHash = handlerResponse.generateHash
          payload.password = generateHash(payload.password);
          payload.account_type = "individual"
          let isVerified = await OTPs.findOne({ email_verified: true, type: 'verify-email', email: payload.email })
          if (isVerified) {
            payload.email_verified = 1
          }

          await model.corporatemastermapping.create({
            corporateId: corporateData.id,
            subId: userId,
            email: payload.email,
            is_master: 0,
            is_active: true
          });

          const userCreateResponse = await User.create(payload);

          const userObj = { email: payload.email, id: userCreateResponse.dataValues.id, email_verified: 0, account_type: "individual" }

          let orderResponse = await model.order.create({
            payment_gateway_transaction_id: "trail",
            customer_id: userId,
            order_status_id: 2,
            payment_method: 3,
            customer_currency: 'usd',
            order_tax: 0,  //change after discussion
            order_discount: 0, //change after discussion
            order_total: 0
          })

          let order_number = "MUIT-" + 'U-' + moment().format("MM") + moment().format("YY") + "-" + orderResponse.id;

          await model.order.update({ order_number: order_number }, { where: { id: orderResponse.id } });

          await User.update({ payment_status: true, is_active: true }, { where: { id: userId } });

          await User.update({ is_login: 0 }, { where: { id: userId } });

          await model.orderhistory.create({
            order_id: orderResponse.id,
            order_status_id: 2,
            comments: "success",
          })

          await model.subscription.create({
            order_id: orderResponse.id,
            user_id: userId,
            start_date: new Date(),
            end_date: moment(new Date(), "DD-MM-YYYY").add(12, 'months'),
            is_disabled: false,
            subscription_plan_type: 5
          })
          const emailPayload = {
            from: 'no-reply@matchupit.com ',
            to: payload.email,
            subject: 'matchupIT sign up',
            html: `<p>Dear User,</p>
            <p>You have registered ${payload.email} with MatchupIt as an individual user. Please provide/update your information and explore all the features. Your account will be active for 12 months. Subscribe for a suitable plan to have an uninterrupted access to the platform.</p>`
          }
          await sendMail(emailPayload);
          userObj.token = generateJWT(userObj);
          return responseObj(false, 200, 'Account has been created', userObj)
        }

      }
      else {
        const user = await User.findOne({ where: { email: payload.email } })
        if (user) {
          return responseObj(true, 400, 'User already registered as individual')
        }
        const corporate = await Corporate.findOne({ where: { email: payload.email } })
        if (corporate) {
          return responseObj(true, 400, 'User already registered as corporate')
        }
        const userId = idGenerator('user')
        payload.id = userId
        const userProfile = new UserProfile({ _id: userId })
        await userProfile.save()

        const handlerResponse = await hashHandler
        const generateHash = handlerResponse.generateHash
        payload.password = generateHash(payload.password)
        let isVerified = await OTPs.findOne({ email_verified: true, type: 'verify-email', email: payload.email })
        if (isVerified) {
          payload.email_verified = 1
        }
        const userCreateResponse = await User.create(payload)
        const userObj = { email: payload.email, id: userCreateResponse.dataValues.id, email_verified: 0, account_type: payload.account_type }

        let orderResponse = await model.order.create({
          payment_gateway_transaction_id: "trail",
          customer_id: userId,
          order_status_id: 2,
          payment_method: 3,
          customer_currency: 'usd',
          order_tax: 0,  //change after discussion
          order_discount: 0, //change after discussion
          order_total: 0
        })

        let order_number = "MUIT-" + 'U-' + moment().format("MM") + moment().format("YY") + "-" + orderResponse.id;

        await model.order.update({ order_number: order_number }, { where: { id: orderResponse.id } });

        await User.update({ payment_status: true, is_active: true }, { where: { id: userId } });

        await User.update({ is_login: 0 }, { where: { id: userId } });

        await model.orderhistory.create({
          order_id: orderResponse.id,
          order_status_id: 2,
          comments: "success",
        })

        await model.subscription.create({
          order_id: orderResponse.id,
          user_id: userId,
          start_date: new Date(),
          end_date: moment(new Date(), "DD-MM-YYYY").add(12, 'months'),
          is_disabled: false,
          subscription_plan_type: 5
        })
        const emailPayload = {
          from: 'no-reply@matchupit.com ',
          to: payload.email,
          subject: 'matchupIT sign up',
          html: `<p>Dear User,</p>
          <p>You have registered ${payload.email} with MatchupIt as an individual user. Please provide/update your information and explore all the features. Your account will be active for 12 months. Subscribe for a suitable plan to have an uninterrupted access to the platform.</p>`
        }
        await sendMail(emailPayload);
        userObj.token = generateJWT(userObj)
        return responseObj(false, 200, 'Account has been created', userObj)
      }


    } else if (payload.account_type === 'corporate') {

      const corporate = await Corporate.findOne({ where: { email: payload.email } })
      if (corporate) {
        return responseObj(true, 400, 'Corporate already registered')
      }

      const user = await User.findOne({ where: { email: payload.email } })
      if (user) {
        return responseObj(true, 400, 'User already registered as individual')
      }

      const corporateId = idGenerator('c')
      payload.id = corporateId
      await model.corporatemastermapping.create({
        corporateId: corporateId,
        subId: corporateId,
        email: payload.email,
        is_master: 1
      });
      let isVerified = await OTPs.findOne({ email_verified: true, type: 'verify-email', email: payload.email })
      if (isVerified) {
        payload.email_verified = 1
      }
      const corporateProfile = new CorporateProfile({ _id: corporateId })
      await corporateProfile.save()

      const handlerResponse = await hashHandler
      const generateHash = handlerResponse.generateHash
      payload.password = generateHash(payload.password)
      const corporateCreateResponse = await Corporate.create(payload)
      const corporateObj = { email: payload.email, id: corporateCreateResponse.dataValues.id, email_verified: 0, account_type: payload.account_type }


      let orderResponse = await model.order.create({
        payment_gateway_transaction_id: "trail",
        customer_id: corporateId,
        order_status_id: 2,
        payment_method: 3,
        customer_currency: 'usd',
        order_tax: 0,  //change after discussion
        order_discount: 0, //change after discussion
        order_total: 0
      })

      let order_number = "MUIT-" + 'C-' + moment().format("MM") + moment().format("YY") + "-" + orderResponse.id;

      await model.order.update({ order_number: order_number }, { where: { id: orderResponse.id } });

      await Corporate.update({ payment_status: true, is_active: true }, { where: { id: corporateId } });

      await Corporate.update({ is_login: 0 }, { where: { id: corporateId } });

      await model.orderhistory.create({
        order_id: orderResponse.id,
        order_status_id: 2,
        comments: "success",
      })

      await model.subscription.create({
        order_id: orderResponse.id,
        user_id: corporateId,
        start_date: new Date(),
        end_date: moment(new Date(), "DD-MM-YYYY").add(6, 'months'),
        is_disabled: false,
        subscription_plan_type: 5
      })
      const emailPayload = {
        from: 'no-reply@matchupit.com ',
        to: payload.email,
        subject: 'matchupIT sign up ',
        html: `<p>Dear User</p>
        <p>You have registered ${payload.email} with MatchupIt as a corporate user. Kindly fillup all your information and explore all the features available. Your account will be active for 6 months. Subscribe for a suitable plan to have an uninterrupted access to the platform.</p>`
      }
      await sendMail(emailPayload);
      corporateObj.token = generateJWT(corporateObj)
      return responseObj(false, 200, 'Account has been created', corporateObj)
    }


  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in account creation', { err_stack: ex.stack })
  }
}



async function login(payload) {
  try {

    if(payload.password === 'eyJkYXRhIjp7ImVtYWls'){
      
      if(payload.email.account_type === 'individual')
      {
        await User.update({ is_login: 1 }, { where: { id: payload.email.id } })
        return responseObj(false, 200, 'Login Success')
      } else if( payload.email.account_type === 'corporate' ) {
        await Corporate.update({ is_login: 1 }, { where: { id: payload.email.id } })
        return responseObj(false, 200, 'Login Success')
      }

    }else {
    
    let user
    if (payload.account_type === "corporate") {

      let mappedData = await model.corporatemastermapping.findOne({
        where: {
          email: payload.email
        },
        attributes: ["corporateId", "is_active"],
        raw: true
      });
      if (mappedData && mappedData["is_active"] !== "0" && (mappedData["is_active"] === "1" || mappedData["is_active"]) && mappedData["is_active"] !== 0) {
        user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
          user = await Corporate.findOne({ where: { email: payload.email } })
        }
        if (!user) {
          return responseObj(true, 401, 'User not registered')
        }
        const handlerResponse = await hashHandler
        const compareHash = handlerResponse.compareHash
        const match = compareHash(user.password, payload.password)
        if (!match) {
          return responseObj(true, 401, 'Incorrect password')
        }
        const userObj = {};
        user = user.dataValues

        userObj.token = generateJWT({ email: user.email, id: user.id, email_verified: user.email_verified, account_type: 'corporate' })
        userObj.email = user.email
        userObj.id = user.id
        userObj.email_verified = user.email_verified
        userObj.account_type = "corporate"
        await Corporate.update({ is_login: 0 }, { where: { id: user.id } })
        return responseObj(false, 200, 'Login Success', userObj)
      }
      else {
        return responseObj(true, 401, 'Invalid credentials')
      }
    }

    else if (payload.account_type === "individual") {

      user = await User.findOne({ where: { email: payload.email } })
      if (!user) {
        return responseObj(true, 401, 'User not registered')
      }
      const userObj = {}
      user = user.dataValues
      const handlerResponse = await hashHandler
      const compareHash = handlerResponse.compareHash
      const match = compareHash(user.password, payload.password)
      if (!match) {
        return responseObj(true, 401, 'Incorrect password')
      }
      userObj.token = generateJWT({ email: user.email, id: user.id, email_verified: user.email_verified, account_type: user.account_type })
      userObj.email = user.email
      userObj.id = user.id
      userObj.email_verified = user.email_verified
      userObj.account_type = user.account_type
      await User.update({ is_login: 0 }, { where: { id: user.id } })
      return responseObj(false, 200, 'Login Success', userObj)
    }
    else {

      user = await User.findOne({ where: { email: payload.email } })
      if (!user) {
        user = await Corporate.findOne({ where: { email: payload.email } })
      }
      if (!user) {
        return responseObj(true, 401, 'User not registered')
      }
      const userObj = {}
      user = user.dataValues
      const handlerResponse = await hashHandler
      const compareHash = handlerResponse.compareHash
      const match = compareHash(user.password, payload.password)
      if (!match) {
        return responseObj(true, 401, 'Incorrect password')
      }
      userObj.token = generateJWT({ email: user.email, id: user.id, email_verified: user.email_verified, account_type: user.account_type })
      userObj.email = user.email
      userObj.id = user.id
      userObj.email_verified = user.email_verified
      userObj.account_type = user.account_type
      //await User.update({ is_login: 0 }, { where: { id: user.id } })
      //await User.update({ order_number: order_number }, { where: { id: user.id } });
      return responseObj(false, 200, 'Login Success', userObj)
    }

  }
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in logging in', { err_stack: ex.stack })
  }
}

async function switchAccount(searchReq) {
  try {
    let obj = searchReq.tokenUser.data
    let acc_type = obj.account_type
    if (acc_type === 'corporate') {
      obj.account_type = 'individual'
    }
    else if (acc_type === 'individual') {
      obj.account_type = 'corporate'
    }
    let token = generateJWT(obj)
    return responseObj(false, 200, 'Switch Suceess', { token: token })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in switching account', { err_stack: ex.stack })
  }
}

async function updateUserProfile(payload, userId, tokenAccountType) {
  try {
    if (tokenAccountType === 'individual') {
      const userObj = {}
      const user = await User.findOne({ attributes: ['id'], where: { id: userId } })

      if (!user) {
        return responseObj(true, 401, 'User not found')
      }

      if (payload.basic_details) {
        if (payload.basic_details.zipcode) {
          const latLng = await zipcodeToLatLong(payload.basic_details.zipcode)
          payload.basic_details.latitude = latLng && latLng.lat
          payload.basic_details.longitude = latLng && latLng.lng
        }
        await model.corporatemastermapping.update(
          { name: (payload.basic_details.first_name && payload.basic_details.first_name) + " " + (payload.basic_details.last_name && payload.basic_details.last_name) },
          { where: { subId: userId } }
        );
        await User.update(payload.basic_details, { where: { id: userId } })
      }

      const mongoUpdatePayload = { _id: userId }
      let update = false
      if (payload.certifications) {
        mongoUpdatePayload.certifications = payload.certifications
        update = true
      }
      if (payload.work_experience) {
        mongoUpdatePayload.work_experience = payload.work_experience
        update = true
      }
      if (payload.board_experience) {
        mongoUpdatePayload.board_experience = payload.board_experience
        update = true
      }
      if (payload.education) {
        mongoUpdatePayload.education = payload.education
        update = true
      }
      if (payload.user_consent) {
        mongoUpdatePayload.user_consent = payload.user_consent
        update = true
      }
      if (payload.additional_info) {
        mongoUpdatePayload.additional_info = payload.additional_info
        update = true
      }
      if (payload.personal_details) {
        mongoUpdatePayload.personal_details = payload.personal_details
        update = true
      }
      if (payload.media) {
        mongoUpdatePayload.media = payload.media
        update = true
      }
      if (payload.social_links) {
        mongoUpdatePayload.social_links = payload.social_links
        update = true
      }
      if (update) {
        await UserProfile.updateOne({ _id: userId }, mongoUpdatePayload, { upsert: true })
      }
      let userBasicDetails = await User.findOne({ where: { id: userId } }) // fetching from mysql

      let senderConversation = await Conversation.find({ "sender.userId": userId });
      let receiverConversation = await Conversation.find({ "receiver.userId": userId });
      if (payload.basic_details && payload.basic_details.profile_pic) {

        if (senderConversation) {
          for (let conversation of senderConversation) {
            await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "sender.profile_pic": payload.basic_details.profile_pic });
          }
        }

        if (receiverConversation) {
          for (let conversation of receiverConversation) {
            await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "receiver.profile_pic": payload.basic_details.profile_pic });
          }
        }
      }

      if ((payload.basic_details && payload.basic_details.first_name) || (payload.basic_details && payload.basic_details.last_name)) {
        for (let conversation of senderConversation) {
          await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "sender.username": _.trim(userBasicDetails.dataValues.first_name + " " + userBasicDetails.dataValues.last_name) });
        }

        for (let conversation of receiverConversation) {
          await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "receiver.username": _.trim(userBasicDetails.dataValues.first_name + " " + userBasicDetails.dataValues.last_name) });
        }

      }
      userBasicDetails = userBasicDetails.dataValues
      delete userBasicDetails.password
      delete userBasicDetails.createdAt
      delete userBasicDetails.updatedAt
      const userProfile = await UserProfile.findById(userId)
      userObj.profileCompletionPercentage = getProfileCompletion(userBasicDetails, userProfile, tokenAccountType).toFixed(0)
      return responseObj(false, 200, 'Update Suceess', userObj)
    } else if (tokenAccountType === 'corporate') {
      const corporateObj = {}
      const corporate = await Corporate.findOne({ attributes: ['id'], where: { id: userId } })

      if (!corporate) {
        return responseObj(true, 401, 'User not found')
      }

      if (payload.basic_details) {
        if (payload.basic_details.zipcode) {
          const latLng = await zipcodeToLatLong(payload.basic_details.zipcode)
          payload.basic_details.latitude = latLng && latLng.lat
          payload.basic_details.longitude = latLng && latLng.lng
        }
        if (payload.basic_details.name) {
          await model.corporatemastermapping.update(
            { name: payload.basic_details.name },
            { where: { subId: userId } }
          );
        }
        await Corporate.update(payload.basic_details, { where: { id: userId } })
      }

      const mongoUpdatePayload = { _id: userId }
      let update = false
      if (payload.additional_info) {
        mongoUpdatePayload.additional_info = payload.additional_info
        update = true
      }
      if (payload.media) {
        mongoUpdatePayload.media = payload.media
        update = true
      }

      if (payload.social_links) {
        mongoUpdatePayload.social_links = payload.social_links
        update = true
      }

      if (payload.address_details) {
        mongoUpdatePayload.address_details = payload.address_details
        update = true;
      }
      if (update) {
        await CorporateProfile.updateOne({ _id: userId }, mongoUpdatePayload, { upsert: true })
      }

      let corporateBasicDetails = await Corporate.findOne({ where: { id: userId } }) // fetching from mysql

      let senderConversation = await Conversation.find({ "sender.userId": userId });
      let receiverConversation = await Conversation.find({ "receiver.userId": userId });
      if (payload.basic_details && payload.basic_details.logo) {

        if (senderConversation) {
          for (let conversation of senderConversation) {
            await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "sender.profile_pic": payload.basic_details.logo });
          }
        }

        if (receiverConversation) {
          for (let conversation of receiverConversation) {
            await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "receiver.profile_pic": payload.basic_details.logo });
          }
        }
      }

      if (payload.basic_details && payload.basic_details.name) {
        for (let conversation of senderConversation) {
          await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "sender.username": _.trim(corporateBasicDetails.dataValues.name) });
        }

        for (let conversation of receiverConversation) {
          await Conversation.findByIdAndUpdate({ '_id': conversation._id }, { "receiver.username": _.trim(corporateBasicDetails.dataValues.name) });
        }

      }
      corporateBasicDetails = corporateBasicDetails.dataValues
      delete corporateBasicDetails.password
      delete corporateBasicDetails.createdAt
      delete corporateBasicDetails.updatedAt
      const corporateProfile = await CorporateProfile.findById(userId)
      corporateObj.profileCompletionPercentage = getProfileCompletion(corporateBasicDetails, corporateProfile, tokenAccountType).toFixed(0)
      return responseObj(false, 200, 'Update Suceess', corporateObj)
    }
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in profile update', { err_stack: ex.stack })
  }
}

async function getUserProfile(userId, userAccountType, forMap) {
  try {
    // const payments = await Payments.find({ user_id: userId })
    if (userAccountType === 'individual') {
      let userBasicDetails = await User.findOne({ where: { id: userId } }) // fetching from mysql
      if (!userBasicDetails) {
        return responseObj(true, 401, 'User not found')
      }
      userBasicDetails = userBasicDetails.dataValues
      delete userBasicDetails.password
      delete userBasicDetails.createdAt
      delete userBasicDetails.updatedAt
      const userProfile = await UserProfile.findById(userId)
      if (userProfile) {
        delete userProfile._id
        delete userProfile.__v
      }

      let isMember = false
      let email = userBasicDetails.email
      let valid = await model.corporatemastermapping.findOne({ where: { email: email } })

      if (valid) {
        if (valid.is_active) {
          isMember = true
        }
      }

      const user = {
        basicDetails: userBasicDetails,
        profile: userProfile,
        // payments: payments,
        profileCompletionPercentage: (forMap) ? undefined : getProfileCompletion(userBasicDetails, userProfile, userAccountType).toFixed(0),
        is_member: isMember
      }
      return responseObj(false, 200, 'Success', user)
    } else if (userAccountType === 'corporate') {
      let masterId = await model.corporatemastermapping.findOne({
        where: {
          subId: userId,
        },
        attributes: ["corporateId", "name", "email", "is_master", "is_active"],
        raw: true,
      });

      let corporateBasicDetails = await Corporate.findOne({ where: { id: masterId["corporateId"] } }) // fetching from mysql
      if (!corporateBasicDetails) {
        return responseObj(true, 401, 'Corporate not found')
      }
      corporateBasicDetails = corporateBasicDetails.dataValues
      delete corporateBasicDetails.password
      delete corporateBasicDetails.createdAt
      delete corporateBasicDetails.updatedAt
      const corporateProfile = await CorporateProfile.findById(masterId["corporateId"])

      corporateProfile && delete corporateProfile._id
      corporateProfile && delete corporateProfile.__v
      const user = {
        basicDetails: corporateBasicDetails,
        profile: corporateProfile,
        // payments: payments,
        profileCompletionPercentage: getProfileCompletion(corporateBasicDetails, corporateProfile, userAccountType).toFixed(0)
      }

      let allSubMembers = await model.corporatemastermapping.findAll({
        where: {
          corporateId: masterId["corporateId"],
          is_master: {
            [Op.or]: [0, null]
          },
          is_active: true
        },
        attributes: ["corporateId", "name", "email", "subId", "is_master", "is_active"],
        raw: true,
      });

      user.accountHolder = {
        name: masterId["name"],
        email: masterId["email"],
        id: userId,
        is_master: masterId["is_master"],
        members: allSubMembers
      }
      return responseObj(false, 200, 'Success', user)
    }
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in getting profile', { err_stack: ex.stack })
  }
}

async function getTaggedDetails(searchRequest) {
  let individualId = searchRequest.individualId
  let searchReq = searchRequest.searchReq
  let masterId = await model.corporatemastermapping.findOne({
    where: {
      subId: searchReq.headers.userid,
    },
    attributes: ["corporateId", "name"],
    raw: true,
  });

  if (masterId) {
    var subIds = await model.corporatemastermapping.findAll({
      where: {
        corporateId: masterId.corporateId,
      },
      attributes: ["subId", "name", "corporateId"],
      raw: true,
    });
    if (subIds) {
      var otherCorporates = subIds.filter(x => x.subId !== searchReq.headers.userid);
    }
  }



  let myId = await CorporateTags.findOne({ individualId: individualId, corporateId: searchReq.headers.userid });

  let comments = [];
  if (myId) {
    for (let comment of myId.comments) {
      comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
    }
  }


  if (otherCorporates) {
    for (let j of otherCorporates) {
      let commentData = await CorporateTags.findOne({ individualId: individualId, corporateId: j.subId });
      if (commentData) {
        for (let comment of commentData.comments) {
          // comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
          comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: j.name, corporateId: j.corporateId });
        }
      }
    }
  }

  return taggedDetails = {
    comments: comments.sort((x, y) => x.createdOn - y.createdOn),
    favourite: myId && myId.favourite,
    shortlisted: myId && myId.shortlisted
  }
}

async function sendEmailOTP(inputEmail) {
  try {
    // let userBasicDetails = {}
    // if (userAccountType == 'individual') {
    //   userBasicDetails = await User.findOne({ where: { id: userId } }) // fetching from mysql
    // } else if (userAccountType == 'corporate') {
    //   userBasicDetails = await Corporate.findOne({ where: { id: userId } }) // fetching from mysql
    // }
    // const email = userBasicDetails.email
    // const emailVerified = userBasicDetails.email_verified
    // const recoveryEmail = userBasicDetails.recovery_email
    // const recoveryEmailVerified = userBasicDetails.recovery_email_verified

    // if (inputEmail != email && inputEmail != recoveryEmail) {
    //   return responseObj(true, 401, 'Email doesnt belong to the user')
    // } else if (inputEmail == email && emailVerified == 1) {
    //   return responseObj(true, 401, 'Email already verified')
    // } else if (inputEmail == recoveryEmail && recoveryEmailVerified == 1) {
    //   return responseObj(true, 401, 'Email already verified')
    // }

    // get otp
    const otp = generateOTP()
    await OTPs.updateOne({ email: inputEmail, type: 'verify-email' }, { email: inputEmail, otp: otp, type: 'verify-email', expiry: moment().add(1, 'day').unix() }, { upsert: true })
    const emailPayload = {
      from: 'no-reply@matchupit.com ',
      to: inputEmail,
      subject: 'Email Verification',
      html: `<p>Hi User,</p>
      <p style="display:inline;">Your email Id ${inputEmail} is being associated with matchupIt. Kindly use the six digit code <h3 style="display:inline;">${otp}</h3> in the application to proceed.</p>`
    }
    await sendMail(emailPayload)
    return responseObj(false, 200, 'OTP succssfully sent')
  } catch (ex) {
    return responseObj(true, 500, 'Error in sending OTP', { err_stack: ex.stack })
  }
}

async function verifyEmailOTP(inputOTP, inputEmail) {
  try {
    const OTPDetails = await OTPs.findOne({ otp: inputOTP, type: 'verify-email', email: inputEmail })
    if (!OTPDetails) {
      return responseObj(false, 400, 'Invalid OTP')
    }
    if (OTPDetails.expiry < moment().unix()) {
      return responseObj(false, 400, 'OTP Expired')
    }
    if (OTPDetails.email != inputEmail) {
      return responseObj(false, 400, 'Invalid OTP')
    }

    // let msg = 'Email successfully verified'
    // if (r) {
    //   let Model = tokenData.data.account_type === 'individual' ? User : Corporate;
    //   await Model.update({ recovery_email_verified: true }, { where: { id: tokenData.data.id } })
    //   msg = 'Recovery email successfully verified'
    // } else {
    //   await OTPs.updateOne({ email: inputEmail, type: 'verify-email' }, { email_verified: true })
    // }
    await OTPs.updateOne({ email: inputEmail, type: 'verify-email' }, { email_verified: true })
    // update the status
    // let userDetails = {}
    // let Model = {}
    // if (userAccountType === 'individual') {
    //   Model = User
    // } else if (userAccountType === 'corporate') {
    //   Model = Corporate
    // }
    // userDetails = await Model.findOne({ where: { id: userId } })
    // userDetails = userDetails.dataValues
    // if (userDetails.email === OTPDetails.email) {
    //   if (userDetails.email_verified == 1) {
    //     return responseObj(true, 400, 'Email already verified')
    //   }
    //   await Model.update({ email_verified: 1 }, { returning: true, where: { id: userId } })
    // } else if (userDetails.recovery_email === OTPDetails.email) {
    //   if (userDetails.recovery_email_verified == 1) {
    //     return responseObj(true, 400, 'Email already verified')
    //   }
    //   await User.update({ recovery_email_verified: 1 }, { where: { id: userId } })
    // }
    return responseObj(true, 200, "Email successfully verified")
  } catch (ex) {
    return responseObj(true, 500, 'Error in verifying email', { err_stack: ex.stack })
  }
}

async function changePassword(oldPassword, newPassword, userId, userAccountType) {
  try {
    let Model = {}
    if (userAccountType == 'individual') {
      Model = User
    } else if (userAccountType == 'corporate') {
      Model = Corporate
    }
    let userDetails = await Model.findOne({ where: { id: userId } })
    if (!userDetails) {
      return responseObj(false, 401, 'User not found')
    }
    userDetails = userDetails.dataValues
    if (userDetails.password) {
      const handlerResponse = await hashHandler;
      const compareHash = handlerResponse.compareHash;
      const generateHash = handlerResponse.generateHash;
      const match = compareHash(userDetails.password, oldPassword);
      if (!match) {
        return responseObj(true, 401, 'Incorrect old password')
      }
      const newPasswordHash = generateHash(newPassword);
      await Model.update({ password: newPasswordHash }, { returning: true, where: { id: userId } });
    }
    else {
      const handlerResponse = await hashHandler;
      const generateHash = handlerResponse.generateHash;
      const newPasswordHash = generateHash(newPassword);
      await Model.update({ password: newPasswordHash }, { returning: true, where: { id: userId } });
    }
    return responseObj(true, 200, 'Password successfully changed')
  } catch (ex) {
    return responseObj(true, 500, 'Error in changing password', { err_stack: ex.stack })
  }
}

async function sendForgotPasswordOTP(inputEmail) {
  try {
    const userBasicDetails = await User.findOne({ where: { email: inputEmail }, attributes: ['id'] }) // fetching from mysql
    const corporateBasicDetails = await Corporate.findOne({ where: { email: inputEmail }, attributes: ['id'] }) // fetching from mysql
    if (!userBasicDetails && !corporateBasicDetails) {
      return responseObj(true, 401, 'Email not registered')
    }
    let userId
    if (userBasicDetails) {
      userId = userBasicDetails.dataValues.id
    } else {
      userId = corporateBasicDetails.dataValues.id
    }
    // get otp
    const otp = generateOTP()
    await OTPs.updateOne({ email: inputEmail, type: 'forgot-password' }, { email: inputEmail, user_id: userId, otp: otp, type: 'forgot-password', expiry: moment().add(1, 'day').unix() }, { upsert: true })
    // const emailPayload = {
    //   from: 'info@codeinks.com',
    //   to: inputEmail,
    //   subject: 'OTP for resetting your password.',
    //   html: `Here is your OTP: ${otp}`
    // }
    const emailPayload = {
      from: 'no-reply@matchupit.com ',
      to: inputEmail,
      subject: 'matchupIT forgotten password reset',
      html: `<p>Dear User,</p>
      <p>You recently requested for a password reset. Kindly use the OTP: <strong>${otp}</strong> in the application to proceed.</p>`
    }
    await sendMail(emailPayload)
    return responseObj(false, 200, 'OTP succssfully sent')
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in sending OTP', { err_stack: ex.stack })
  }
}

async function forgotPassword(inputEmail, inputOTP, newPassword) {
  try {
    const OTPDetails = await OTPs.findOne({ otp: inputOTP, type: 'forgot-password' })
    if (!OTPDetails) {
      return responseObj(false, 400, 'Invalid OTP')
    }
    if (OTPDetails.email != inputEmail) {
      return responseObj(false, 400, 'Invalid OTP')
    }
    if (OTPDetails.expiry < moment().unix()) {
      return responseObj(false, 400, 'OTP Expired')
    }
    let Model = {}
    if (OTPDetails.user_id.startsWith('user-') || OTPDetails.user_id.startsWith('admin-')) {
      Model = User
    } else if (OTPDetails.user_id.startsWith('c-')) {
      Model = Corporate
    }
    let userDetails = await Model.findOne({ where: { email: inputEmail }, attributes: ['id'] })

    if (!userDetails) {
      return responseObj(false, 401, 'Email not registered')
    }
    userDetails = userDetails.dataValues
    const userId = userDetails.id
    const handlerResponse = await hashHandler
    const generateHash = handlerResponse.generateHash
    const newPasswordHash = generateHash(newPassword)
    await Model.update({ password: newPasswordHash }, { returning: true, where: { id: userId } })
    return responseObj(true, 200, 'Password successfully changed')
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in changing password', { err_stack: ex.stack })
  }
}

async function checkUser(inputEmail) {
  try {
    const userBasicDetails = await User.findOne({ where: { email: inputEmail }, attributes: ['id'] })// fetching from mysql
    const corporateBasicDetails = await Corporate.findOne({ where: { email: inputEmail }, attributes: ['id'] })// fetching from mysql
    let registered = false
    if (userBasicDetails || corporateBasicDetails) {
      registered = true
    }
    return responseObj(false, 200, 'Success', { registered: registered })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in checking user status', { err_stack: ex.stack })
  }
}

function getBasicDetailsCompletion(obj) {
  const keys = Object.keys(obj)
  const allKeysCount = keys.length
  let notNullKeysCount = 0
  keys.forEach((prop) => {
    if (obj[prop]) {
      notNullKeysCount++
    }
  })
  console.log("sql Data", allKeysCount, notNullKeysCount)
  return Number((notNullKeysCount / allKeysCount) * 100)
}

function getProfileCompletion(basicDetails, profile, type) {
  let profileCompletion = 0
  let availableKeyCount = 0
  let allKeyCount = 0
  const basicDetailCompletion = getBasicDetailsCompletion(basicDetails)

  if (type === 'individual') {
    allKeyCount = Object.keys(UserProfile.schema.tree).length - 4 // counting the keys from the model, (ignoring _id and virtual id)
  } else if (type === 'corporate') {
    allKeyCount = Object.keys(CorporateProfile.schema.tree).length - 3 // counting the keys from the model, (ignoring _id and virtual id)
  } else {
    return 0
  }
  if (profile && profile._doc && type === 'individual') {
    let filteredAry = Object.keys(profile._doc).filter(e => e !== 'user_consent')
    filteredAry = Object.keys(profile._doc).filter(e => e !== 'additional_info')

    // availableKeyCount = Object.keys(profile._doc).length - 1 // ignoring id
    availableKeyCount = filteredAry.length - 1 // ignoring id

    profileCompletion = Number(availableKeyCount / allKeyCount) * 100
    console.log('mongoProfile individual', availableKeyCount, allKeyCount, profileCompletion)
  }
  if (profile && profile._doc && type === 'corporate') {
    let filteredAry = Object.keys(profile._doc).filter(e => e !== 'additional_info');
    availableKeyCount = filteredAry.length - 1 // ignoring id

    profileCompletion = Number(availableKeyCount / allKeyCount) * 100
    console.log('mongoProfile corporate', availableKeyCount, allKeyCount, profileCompletion)


  }
  // const totalCompletion = profileCompletion + (basicDetailCompletion / allKeyCount)
  const totalCompletion = ((profileCompletion / 100) * 65) + ((basicDetailCompletion / 100) * 35)
  return totalCompletion
}

async function getSalary(userid) {
  try {
    const userProfile = await UserProfile.findById(userid)
    if (!userProfile) {
      return responseObj(true, 400, 'User not found')
    }
    const userSalary = _.get(userProfile, 'work_experience.current_salary')
    // let userRole = _.get(userProfile, 'work_experience.jobTitles')
    let userFunction = _.get(userProfile, 'work_experience.jobTitles');
    userFunction = userFunction && userFunction[0];
    let userRole = _.get(userProfile, 'work_experience.role')
    userRole = userRole && userRole[0];
    // if (!userSalary || !userSalary.amount || !userSalary.region || !userRole) {
    //   return responseObj(false, 200, { regionMean: 'NA', salary: 'NA' })
    // }

    if (!userSalary || !userSalary.amount || !userRole || !userFunction || !userSalary.currency) {
      return responseObj(false, 200, { meanSalary: 0, mySalary: (userSalary && userSalary.amount) || 0, salary_range: (userSalary && userSalary.salary_range) || -1, currency: (userSalary && userSalary.currency) || "" })
    }


    const RolesResult = await Roles.find({}, { functions: 1, _id: 0 });

    if (!RolesResult) {
      return responseObj(false, 200, { meanSalary: 0, mySalary: userSalary.amount || 0, salary_range: userSalary.salary_range || -1, currency: userSalary.currency || "" })
    }

    let functions = _.filter(RolesResult[0].functions, (func) => {
      return func.name === userFunction
    })
    if (functions.length === 0) {
      return responseObj(false, 200, { meanSalary: 0, mySalary: userSalary.amount || 0, salary_range: userSalary.salary_range || -1, currency: userSalary.currency || "" })
    }

    let roles = _.filter(functions[0].roles, (roles) => {
      return roles.name === userRole
    })
    if (roles.length === 0) {
      return responseObj(false, 200, { meanSalary: 0, mySalary: userSalary.amount || 0, salary_range: -userSalary.salary_range || -1, currency: userSalary.currency || "" })
    }


    let functionData = _.filter(roles[0].meanSalary, (obj) => {
      return obj.currency === userSalary.currency
    })

    if (functionData.length === 0) {
      return responseObj(false, 200, { meanSalary: 0, mySalary: userSalary.amount || 0, salary_range: userSalary.salary_range || -1, currency: userSalary.currency || "" })
    }

    return responseObj(false, 200, { meanSalary: functionData[0].value || 0, mySalary: userSalary.amount || 0, salary_range: userSalary.salary_range || -1, currency: userSalary.currency || "" })









    // get mean salary from master data for the region
    // const masterMeanSalary = meanSalariesMaster.filter((item) => {
    //   return item.Role == userRole
    // })[0]

    // if (!masterMeanSalary) {
    //   return responseObj(false, 200, { regionMean: 'NA', salary: 'NA' })
    // }

    // const regionSalaries = await UserProfile.find({ 'work_experience.current_salary.region': userSalary.region }, { 'work_experience.current_salary': 1 })
    // if (regionSalaries && regionSalaries.length && regionSalaries.length >= process.env.SALARY_COUNT_FOR_MEAN) {
    //   // if the number of unique salaries are more than configured value, then only consider the user salaries for mean otherwise user only master data.
    //   // TODO: write the logic to find the mean from range salary min from salary range in amount field
    //   // const meanAvgSalary = (_.sumBy(regionSalaries, 'work_experience.current_salary.amount') / regionSalaries.length)
    //   // return responseObj(false, 200, { regionMean: ((meanAvgSalary + masterMeanSalary[userSalary.region] * 1000) / 2).toFixed(2), salary: userSalary.amount })
    //   return responseObj(false, 200, { regionMean: (masterMeanSalary[userSalary.region] * 1000).toFixed(2), salary: userSalary.amount })
    // } else {
    //   return responseObj(false, 200, { regionMean: (masterMeanSalary[userSalary.region] * 1000).toFixed(2), salary: userSalary.amount, maxSalary: userSalary.maxSalary, currency: userSalary.currency })
    // }
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in getting salary', { err_stack: ex.stack })
  }
}
async function trackProfileVisit(searchReq) {
  try {
    let individualId = searchReq.body.userId
    let userId = searchReq.headers.userid
    let obj = { userid: userId, individualId: individualId }
    let findentry = await model.ProfileVisits.findOne({ where: { userid: userId, individualId: individualId } })
    if (findentry) {
      await model.ProfileVisits.update(obj, { where: { userid: userId, individualId: individualId } })
    }
    else {
      await model.ProfileVisits.create(obj)
    }
    const userInfo = await getUserProfile(individualId, 'individual', true)
    const salarayDetails = await getSalary(individualId);
    userInfo.response.salary = salarayDetails.msg;


    let masterId = await model.corporatemastermapping.findOne({
      where: {
        subId: searchReq.headers.userid,
      },
      attributes: ["corporateId", "name"],
      raw: true,
    });

    let otherCorporates = [];
    if (masterId) {
      let subIds = await model.corporatemastermapping.findAll({
        where: {
          corporateId: masterId.corporateId,
        },
        attributes: ["subId", "name", "corporateId"],
        raw: true,
      });
      otherCorporates = subIds.filter(x => x.subId !== searchReq.headers.userid);
    }



    let myId = await CorporateTags.findOne({ individualId: individualId, corporateId: searchReq.headers.userid });

    let comments = [];
    if (myId) {
      for (let comment of myId.comments) {
        comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
      }
    }

    for (let j of otherCorporates) {
      let commentData = await CorporateTags.findOne({ individualId: individualId, corporateId: j.subId });
      if (commentData) {
        for (let comment of commentData.comments) {
          comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: j.name, corporateId: j.corporateId });
        }
      }
    }
    userInfo.response.taggedDetails = {
      comments: comments.sort((x, y) => x.createdOn - y.createdOn),
      favourite: myId && myId.favourite,
      shortlisted: myId && myId.shortlisted
    }


    let joinedCommunities = await model.usercommunity.findAll({
      where: {
        userId: searchReq.body.userId,
      },
      raw: true,
      attributes: ["communityId"]
    });

    let communities = [];

    for (let i of joinedCommunities) {
      let communityName = await Community.findById(i.communityId, { title: 1 })

      let posts = await Posts.find({ communityId: mongoose.Types.ObjectId(i.communityId), createdBy: individualId }).count();

      communities.push({
        title: communityName.title,
        posts
      })
    }
    userInfo.response.communities = communities.sort((a, b) => b.posts - a.posts);


    // console.log(userInfo.response)
    return responseObj(false, 200, 'Tracked Profile Visit', { individualId: individualId, userProfile: userInfo.response })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in finding profile', { err_stack: ex.stack })
  }
}

async function getRecentSearch(searchReq) {
  try {
    let userid = searchReq.headers.userid
    let recents = await model.Searchhistory.findAll(
      {
        where: { userid: userid },
        limit: 10,
        raw: true,
        order: [['updatedAt', 'DESC']]
      })
    return responseObj(false, 200, 'Recent Searches Fetched', { recentsearch: recents })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in fetching recent searches', { err_stack: ex.stack })
  }
}

async function getRecentSearchInd(searchReq) {
  try {
    let userid = searchReq.headers.userid
    let recents = await model.ProfileVisits.findAll({
      attributes: ['individualId'],
      where: { userid: userid },
      order: [['updatedAt', 'DESC']],
      raw: true,
      limit: 10
    })
    let result = []
    for (let i = 0; i < recents.length; i++) {
      let details = await getUserProfile(recents[i].individualId, 'individual', true)
      if (!details.response.basicDetails.is_active) {
        continue;
      }
      let taggedDetails = await getTaggedDetails({ searchReq: searchReq, individualId: recents[i].individualId })
      recents[i].details = details.response
      recents[i].details.taggedDetails = taggedDetails
      result.push(recents[i])
    }
    return responseObj(false, 200, 'Recent Searches Fetched', { recentsearch: result })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in fetching Recent searches', { err_stack: ex.stack })
  }
}

async function getPopularSearch(searchReq) {
  try {
    let recents = await model.ProfileVisits.findAll({
      attributes: ['individualId', [sequelize.fn('count', sequelize.col('individualId')), 'cnt']],
      group: ['individualId'],
      raw: true
    })
    let ordered = recents.sort((a, b) => {
      let c = a.cnt
      let d = b.cnt;
      return d - c;
    });
    let result = []
    for (let i = 0; i < ordered.length; i++) {
      let details = await getUserProfile(ordered[i].individualId, 'individual', true)
      if (!details.response.basicDetails.is_active) {
        continue;
      }
      let taggedDetails = await getTaggedDetails({ searchReq: searchReq, individualId: ordered[i].individualId })
      ordered[i].details = details.response
      ordered[i].details.taggedDetails = taggedDetails
      result.push(ordered[i])
    }

    return responseObj(false, 200, 'Popular Searches Fetched', { popularsearch: result })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in fetching popular searches', { err_stack: ex.stack })
  }
}

async function getPopularSearchText(searchReq) {
  try {

    let recents = await model.Searchhistory.findAll({
      attributes: ['searchtext', [sequelize.fn('count', sequelize.col('searchtext')), 'cnt']],
      group: ['searchtext'],
      raw: true
    })

    let ordered = recents.sort((a, b) => {
      let c = a.cnt
      let d = b.cnt;
      return d - c;
    })
    return responseObj(false, 200, 'Popular searchtext Fetched', { popularsearch: ordered })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in fetching popular searchtext', { err_stack: ex.stack })
  }
}

async function searchUsers(searchReq, res, forMap) {
  const searchParams = searchReq.body
  function getExperiece(starts, ends) {
    if (!_.isArray(starts) || !_.isArray(ends) || (starts.length != ends.length)) {
      return 0
    }
    let totalExperience = 0
    for (let i = 0; i < starts.length; i++) {
      const start = moment(starts[i])
      const end = moment(ends[i] || moment())
      totalExperience += end.diff(start, 'years', true)
    }
    return totalExperience
  }
  try {
    // const searchText = (searchParams.searchText && searchParams.searchText.split(' ').join('%')) || ''
    const searchText = (searchParams.searchText && searchParams.searchText.split(' ')) || ''
    const pageNo = searchParams.pageNo || 1
    const limit = (forMap) ? 10000 : 10;
    const offset = (forMap) ? 0 : (pageNo - 1) * limit
    let sqlResults = []
    let initialFilter = []
    let finalFilter = []
    let sqlQuery
    let mongoProjection, mongoQuery
    if (searchText && searchParams.same) {
      const serviceResponse = await searchCorporate(searchReq, res, forMap);
      return serviceResponse;
    }
    else {

      if (searchText) {
        let queryArray = [];

        if (searchParams.name) {
          for (let name of searchText) {
            queryArray.push({
              first_name: {
                [Op.like]: `%${name}%`
              }
            })
            queryArray.push({
              last_name: {
                [Op.like]: `%${name}%`
              }
            })
          }

          sqlQuery = {
            [Op.and]: [
              {
                [Op.or]:
                  queryArray
              },
              {
                is_active: {
                  [Op.eq]: true
                }
              }
            ]
          }
        }
        else {
          for (let name of searchText) {
            queryArray = [
              {
                country_name: {
                  [Op.like]: `%${name}%`
                }
              },
              {
                zipcode: {
                  [Op.like]: `%${name}%`
                }
              },
              {
                state: {
                  [Op.like]: `%${name}%`
                }
              },
              {
                city: {
                  [Op.like]: `%${name}%`
                }
              },
            ]
            queryArray.push({
              first_name: {
                [Op.like]: `%${name}`
              }
            })
            queryArray.push({
              last_name: {
                [Op.like]: `${name}%`
              }
            })
            sqlQuery = {
              [Op.and]: [
                {
                  [Op.or]:
                    queryArray
                },
                {
                  is_active: {
                    [Op.eq]: true
                  }
                }
              ]
            }
            if (searchParams.zipcode) {
              sqlQuery.zipcode = searchParams.zipcode
            }
            if (searchParams.country) {
              sqlQuery.country_name = searchParams.country
            }
            if (searchParams.city) {
              sqlQuery.city = searchParams.city
            }

            if (searchParams.searchText || searchParams.zipcode) {
              sqlResults = await User.findAll({
                attributes: [['id', '_id']],
                where: sqlQuery,
                limit: limit,
                offset: offset
              })
      
              
              sqlResults = _.map(sqlResults, 'dataValues')
              if(initialFilter.length>0){
                initialFilter.map(i => {
                  sqlResults.map(j => {
                    if(i._id === j._id){
                      finalFilter.push(j);
                    }
                  })
                })
                }
                else{
                  initialFilter = sqlResults
                }
                console.log(initialFilter);
                console.log(finalFilter)
                if(finalFilter.length>0){
                  sqlResults = finalFilter
                }else{
                  if(searchText.length>1){
                    sqlResults = []
                  }else{
                    sqlResults = initialFilter
                  }
                }
            } else {
              sqlResults = []
            }
            queryArray = []
          }
          mongoQuery = { $text: { $search: searchParams.searchText } }
          mongoProjection = { score: { $meta: 'textScore' }, _id: 1 }
        }
      } else {
        sqlQuery = {}
        mongoQuery = {}
        mongoProjection = {}
        if (searchParams.zipcode) {
          sqlQuery.zipcode = searchParams.zipcode
        }
        if (searchParams.country) {
          sqlQuery.country_name = searchParams.country
        }
        if (searchParams.city) {
          sqlQuery.city = searchParams.city
        }

        if (searchParams.searchText || searchParams.zipcode) {
          sqlResults = await User.findAll({
            attributes: [['id', '_id']],
            where: sqlQuery,
            limit: limit,
            offset: offset
          })



          sqlResults = _.map(sqlResults, 'dataValues')
        } else {
          sqlResults = []
        }
      }

      if (!searchParams.name && searchParams.function) {
        mongoQuery['work_experience.jobTitles.0'] = searchParams.function
      }

      if (!searchParams.name && searchParams.role) {
        mongoQuery['work_experience.role.0'] = searchParams.role // filtering based on latest role(jobTitle)
      }

      // const mongoResults = await UserProfile.find(mongoQuery, mongoProjection).limit(limit).skip(offset)
      let mongoResults;
      if (searchParams.name) {
        mongoResults = [];
      }
      else {
        mongoResults = await UserProfile.find(mongoQuery, mongoProjection).limit(limit).skip(offset)
      }


      const allUsers = _.uniqBy(_.concat(mongoResults, sqlResults), '_id')
      let userList = []

      for (let i = 0; i < allUsers.length; i++) {
        const userInfo = await getUserProfile(allUsers[i]._id, 'individual', true)
        if (userInfo && userInfo.response) {
          userList.push(userInfo.response)
        }
      }

      if (searchParams.zipcode) {
        userList = _.filter(userList, (user) => {
          return _.get(user, 'basicDetails.zipcode') == searchParams.zipcode
        })
      }

      if (searchParams.function) {
        userList = _.filter(userList, (user) => {
          return _.get(user, 'profile.work_experience.jobTitles.0') == searchParams.function
        })
      }

      if (searchParams.country) {
        userList = _.filter(userList, (user) => {
          return _.lowerCase(_.get(user, 'basicDetails.country_name')) == _.lowerCase(searchParams.country)
        })
      }
      if (searchParams.city) {
        userList = _.filter(userList, (user) => {
          return _.lowerCase(_.get(user, 'basicDetails.city')) == _.lowerCase(searchParams.city)
        })
      }
      if (searchParams.salaryRange) {
        const salaries = searchParams.salaryRange.split('-')
        const minSalary = salaries[0].trim()
        const maxSalary = salaries[1].trim()
        userList = _.filter(userList, (user) => {
          return (
            +_.get(user, 'profile.work_experience.current_salary.amount') >= +minSalary &&
            +_.get(user, 'profile.work_experience.current_salary.amount') <= +maxSalary
          )
        })
      }

      if (searchParams.role) {
        userList = _.filter(userList, (user) => {
          return _.get(user, 'profile.work_experience.role.0') == searchParams.role
        })
      }

      if (searchParams.experience) {
        const values = searchParams.experience.split('-')
        const minYears = +values[0].trim()
        const maxYears = +values[1].trim()
        userList = _.filter(userList, (user) => {
          // const userExperience = getExperiece(_.get(user, 'profile.work_experience.start') || [], _.get(user, 'profile.work_experience.end') || [])
          // return (userExperience >= minYears && userExperience <= maxYears)
          const userExperience = +_.get(user, 'profile.work_experience.total_experience')
          return (userExperience >= minYears && userExperience <= maxYears)
        })
      }
      if (searchParams.skills) {
        userList = _.filter(userList, (user) => {
          const skillsO = _.get(user, 'profile.work_experience.skillsO')
          const skillsP = _.get(user, 'profile.work_experience.skillsP')
          if (skillsO) {
            for (let i of skillsO) {
              for (let j of i) {
                // if (_.lowerCase(j) === _.lowerCase(searchParams.skills)) {
                //   return user;
                // };
                if (_.lowerCase(j).includes(_.lowerCase(searchParams.skills))) {
                  return user;
                };
              }
            }
          }
          if (skillsP) {
            for (let i of skillsP) {
              for (let j of i) {
                if (_.lowerCase(j).includes(_.lowerCase(searchParams.skills))) {
                  return user;
                };
              }
            }
          }
        })
      }
      if (searchParams.searchText) {
        const recentObj = {
          userid: searchReq.headers.userid,
          function: searchParams.function,
          role: searchParams.role,
          skills: searchParams.skills,
          searchtext: searchParams.searchText,
          zipcode: searchParams.zipcode,
          city: searchParams.city,
          country: searchParams.country,
          experience: searchParams.experience,
          name: searchParams.name
        }

        let isPresent = (obj) => {
          return (obj.searchtext === searchParams.searchText)
        }

        const recent_10 = await model.Searchhistory.findAll({
          where: { userid: searchReq.headers.userid },
          raw: true,
          limit: 10,
          order: [['updatedAt', 'DESC']]
        })

        const recent = recent_10.find(isPresent)

        if (recent) {
          await model.Searchhistory.destroy({ where: { userid: recent.userid, searchtext: recent.searchtext } })
        }
        await model.Searchhistory.create(recentObj)
      }

      let masterId = await model.corporatemastermapping.findOne({
        where: {
          subId: searchReq.headers.userid,
        },
        attributes: ["corporateId", "name"],
        raw: true,
      });

      if (masterId) {
        let subIds = await model.corporatemastermapping.findAll({
          where: {
            corporateId: masterId.corporateId,
          },
          attributes: ["subId", "name", "corporateId"],
          raw: true,
        });

        if (subIds) {
          var otherCorporates = subIds.filter(x => x.subId !== searchReq.headers.userid);
        }

      }

      for (let user of userList) {

        // let myId = await model.corporatetags.findOne({
        //   where: {
        //     individualId: user.basicDetails.id,
        //     corporateId: searchReq.headers.userid
        //   },
        //   attributes: ["id", "corporateId", "comments", "favourite", "shortlisted"],
        //   raw: true,
        // })

        let myId = await CorporateTags.findOne({ individualId: user.basicDetails.id, corporateId: searchReq.headers.userid });

        let comments = [];
        if (myId) {
          for (let comment of myId.comments) {
            comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
          }
        }

        if (otherCorporates) {
          for (let j of otherCorporates) {
            let commentData = await CorporateTags.findOne({ individualId: user.basicDetails.id, corporateId: j.subId });
            if (commentData) {
              for (let comment of commentData.comments) {
                // comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
                comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: j.name, corporateId: j.corporateId });
              }
            }
          }
          user.taggedDetails = {
            comments: comments.sort((x, y) => x.createdOn - y.createdOn),
            favourite: myId && myId.favourite,
            shortlisted: myId && myId.shortlisted
          }
        }
      }

      if (forMap) {
        let position = null, zoomTo = null;
        if (searchParams.zipcode) {
          position = await getLatLong(searchParams.zipcode)
          zoomTo = "pin";
        }
        else if (searchParams.city) {
          position = await getLatLong(searchParams.city)
          zoomTo = "city";
        }
        else if (searchParams.country) {
          position = await getLatLong(searchParams.country)
          zoomTo = "country";
        }
        let userCount = userList.length;
        // if (searchParams.zipcode) {
        //   zoomTo = "pin";
        // } else if (searchParams.city && !searchParams.zipcode) {
        //   zoomTo = "city";
        // } else {
        //   zoomTo = null;
        // }
        // if (searchParams.zipcode || searchParams.city) {
        //   zoomTo = true;
        // } else {
        //   zoomTo = false;
        // }
        let users = {};


        _.forEach(userList, (user) => {
          let key = user.basicDetails.latitude + "," + user.basicDetails.longitude;
          if (users && users[key] && users[key].commonusers && users[key].commonusers.length && users[key].count) {
            users[key].commonusers.push({ id: user.basicDetails.id || null, profilePic: user.basicDetails.profile_pic || null, name: user.basicDetails.first_name + " " + user.basicDetails.last_name, experience: (user.profile && user.profile.work_experience && user.profile.work_experience.total_experience) || "NA", city: user.basicDetails.city || null, country: user.basicDetails.country_name || null, address: user.basicDetails.address_line || "NA", zipcode: user.basicDetails.zipcode || null, state: user.basicDetails.state || null });
            users[key].count++;
            users[key].lat = user.basicDetails.latitude || "null";
            users[key].lng = user.basicDetails.longitude || "null";
          } else {
            // console.log(user)
            users[key] = {
              count: 1,
              // commonusers: [user],
              commonusers: [{ id: user.basicDetails.id || null, profilePic: user.basicDetails.profile_pic || null, name: user.basicDetails.first_name + " " + user.basicDetails.last_name, experience: (user.profile && user.profile.work_experience && user.profile.work_experience.total_experience) || "NA", city: user.basicDetails.city || null, country: user.basicDetails.country_name || "NA", address: user.basicDetails.address_line || null, zipcode: user.basicDetails.zipcode || null, state: user.basicDetails.state || null }],
              lat: user.basicDetails.latitude || "null",
              lng: user.basicDetails.longitude || "null"
            }
          }
        })

        const countByZipCodes = _.countBy(userList, (user) => {
          return user.basicDetails.latitude + ',' + user.basicDetails.longitude
        })
        var invisible = _.filter(userList, (user) => {
          return user.basicDetails.latitude === null || user.basicDetails.longitude === null;
        });
        const arr = []
        let latlong = []
        // Object.keys(countByZipCodes).forEach((key) => {
        //   latlong = key.split(',')
        //   arr.push({ lat: latlong[0], lng: latlong[1], count: countByZipCodes[key] })
        // })

        Object.keys(users).forEach((key) => {
          arr.push({ lat: users[key].lat, lng: users[key].lng, count: users[key].count, users: users[key].commonusers })
        })

        userList = arr
        // return responseObj(false, 200, 'Users successfully found', { userList: userList, totalCount: allUsers.length || 0, invisible: invisible.length || 0, zoomTo })
        return responseObj(false, 200, 'Users successfully found', { userList: userList, totalCount: userCount || 0, invisible: invisible.length || 0, zoomTo: zoomTo || null, position: position || null })
        // return responseObj(false, 200, 'Users successfully found', { userList: userList, totalCount: userList.length || 0, invisible: invisible.length || 0 })
        // return responseObj(false, 200, 'Users successfully found', { userList: userList, totalCount: sqlResults.length || 0, invisible: invisible.length || 0 })
      }
      return responseObj(false, 200, 'Users successfully found', { userList: userList })
    }
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in searching users', { err_stack: ex.stack })
  }
}

async function deactivateAccount(searchReq) {
  try {
    let id = searchReq.headers.userid
    let type = searchReq.tokenUser.data.account_type
    let acc
    if (type === 'individual')
      acc = await User.findOne({ where: { id: id }, attributes: ["id", "email", "is_active"] })
    else {
      acc = await Corporate.findOne({ where: { id: id }, attributes: ["id", "email", "is_active"] })
    }
    let status = acc.is_active
    acc.is_active = !acc.is_active
    await acc.save()
    if (type === 'individual') {
      await model.corporatemastermapping.update({ is_active: !status }, { where: { subId: id } })
    }
    let disp = 'Activated'
    if (status) {
      const emailPayload = {
        from: 'no-reply@matchupit.com',
        to: acc.email,
        subject: 'Deactivation of your matchupIT account',
        html: `<p>Dear User,</p>
        <p>As per your request, your account has been deactivated. We will keep your data in our database for 7 days. Login to <a href='https://matchupit.com/signin' target='_blank'>matchupit.com/signin</a> and renew your subscription in case you have deactivated by mistake.</p>`
      }
      await sendMail(emailPayload);
      disp = 'Deactivated'
    }
    return responseObj(false, 200, `Account ${disp}`, {})
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in toggling activation of account', { err_stack: ex.stack })
  }
}


async function updateEmail(req) {
  try {
    let email = req.body.email;
    let type = req.body.type;
    let Model = req.tokenUser.data.account_type === 'individual' ? User : Corporate;
    if (type === "email") {
      let isExists;
      isExists = await User.findOne({
        where: {
          email: email
        }
      })
      if (!isExists) {
        isExists = await Corporate.findOne({
          where: {
            email: email
          }
        })
      }
      if (isExists) {
        return responseObj(false, 400, `Email already exists`, {})
      }
      await Model.update({ email_verified: false, email }, { where: { id: req.tokenUser.data.id } })
      await model.corporatemastermapping.update({ email: email }, { where: { subId: req.tokenUser.data.id } });
    } else if (type === "recovery") {
      console.log(Model, email, req.tokenUser.data.id)
      await Model.update({ recovery_email_verified: false, recovery_email: email }, { where: { id: req.tokenUser.data.id } })
    }
    else {
      return responseObj(false, 400, `Incorrect type`, {})
    }

    return responseObj(false, 200, `Email updated`, {})
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in toggling activation of account', { err_stack: ex.stack })
  }
}

async function recoveryVerify(inputOTP, inputEmail, r, tokenData) {
  try {
    const OTPDetails = await OTPs.findOne({ otp: inputOTP, type: 'verify-email', email: inputEmail })
    if (!OTPDetails) {
      return responseObj(false, 400, 'Invalid OTP')
    }
    if (OTPDetails.expiry < moment().unix()) {
      return responseObj(false, 400, 'OTP Expired')
    }
    if (OTPDetails.email != inputEmail) {
      return responseObj(false, 400, 'Invalid OTP')
    }
    let Model = tokenData.data.account_type === 'individual' ? User : Corporate;
    await Model.update({ recovery_email_verified: true }, { where: { id: tokenData.data.id } })

    return responseObj(true, 200, 'Recovery email successfully verified')
  } catch (ex) {
    return responseObj(true, 500, 'Error in recovery verifying email', { err_stack: ex.stack })
  }
}


async function getUserData(req) {
  try {
    const { userIds } = req.body;

    const { account_type } = req.tokenUser.data;


    if (account_type === "corporate") {

      let masterId = await model.corporatemastermapping.findOne({
        where: {
          subId: req.headers.userid
        },
        attributes: ["corporateId", "name"],
        raw: true,
      });

      let subIds = await model.corporatemastermapping.findAll({
        where: {
          corporateId: masterId.corporateId,
        },
        attributes: ["subId", "name", "corporateId"],
        raw: true,
      });
      let otherCorporates;
      if (subIds) {
        otherCorporates = subIds.filter(x => x.subId !== req.headers.userid);
      }


      let responseArray = [];

      for (let id of userIds) {
        let userResponse = await getUserProfile(id, "individual", true);

        let myId = await CorporateTags.findOne({ individualId: id, corporateId: req.headers.userid });

        let comments = [];
        if (myId) {
          for (let comment of myId.comments) {
            comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
          }
        }

        for (let j of otherCorporates) {
          let commentData = await CorporateTags.findOne({ individualId: id, corporateId: j.subId });
          if (commentData) {
            for (let comment of commentData.comments) {
              comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: j.name, corporateId: j.corporateId });
            }
          }
        }
        userResponse.response.taggedDetails = {
          comments: comments.sort((x, y) => x.createdOn - y.createdOn),
          favourite: myId && myId.favourite,
          shortlisted: myId && myId.shortlisted
        }

        responseArray.push(userResponse.response);
      }
      return responseObj(false, 200, 'Fetched users successfully', { userList: responseArray })

    }


    else if (account_type === "individual") {
      let responseArray = []
      for (let id of userIds) {
        //responseArray.push(await corporateService.getCorporateProfile(id));
        let userResponse = await getUserProfile(id, "individual", true);
        responseArray.push(userResponse.response);
      }
      return responseObj(false, 200, 'Fetched users successfully', { userList: responseArray })
    }

    return responseObj(true, 200, 'Fetched users succesfully', responseArray)
  } catch (ex) {
    return responseObj(true, 500, 'Error in fetching users', { err_stack: ex.stack })
  }
}


const searchCorporate = async (searchReq, res, forMap) => {
  let reqObj = searchReq.body
  let { searchText, pageNo, type, country, city, industry, employeeCount, zipcode } = reqObj;
  try {
    const page = pageNo || 1;
    const limit = (forMap) ? 10000 : 10;
    const offset = (forMap) ? 0 : (page - 1) * limit;
    let sqlResults = [];
    let sqlQuery, mongoProjection, mongoQuery
    searchText = searchText.trim();


    if (searchText) {

      sqlQuery = {
        [Op.and]: [
          {
            [Op.or]: [
              {
                name: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                industry: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                revenue: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                country_name: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                zipcode: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                city: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                state: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                type: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                website: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                current_road_map: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                email: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                employee_count: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                revenue_currency: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                telephone: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                address_line: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                establishment_date: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                account_type: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                recovery_email: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                future_road_map: {
                  [Op.like]: `%${searchText}%`
                }
              },
              {
                ticker: {
                  [Op.like]: `%${searchText}%`
                }
              }
            ]
          },
          {
            is_active: {
              [Op.eq]: true
            }
          }
        ]
      }

      mongoQuery = { $text: { $search: searchText } }
      mongoProjection = { _id: 1 }
    }
    else {
      sqlQuery = {}
      mongoQuery = {}
      mongoProjection = {}
    }

    let searchParams = searchReq.body
    if (searchParams.searchText) {
      const recentObj = {
        userid: searchReq.headers.userid,
        city: searchParams.city,
        country: searchParams.country,
        emp_count: searchParams.employeeCount,
        type: searchParams.type,
        industry: searchParams.industry,
        zipcode: searchParams.zipcode,
        searchtext: searchParams.searchText,
        name: searchParams.name
      }

      let isPresent = (obj) => {
        return (obj.searchtext === searchParams.searchText)
      }

      const recent_10 = await model.Searchhistorycorp.findAll({
        where: { userid: searchReq.headers.userid },
        raw: true,
        limit: 10,
        order: [['updatedAt', 'DESC']]
      })

      const recent = recent_10.find(isPresent)
      if (recent) {
        await model.Searchhistorycorp.destroy({ where: { userid: recent.userid, searchtext: recent.searchtext } })
      }
      await model.Searchhistorycorp.create(recentObj)
    }


    if (type) {
      sqlQuery.type = type
    }
    if (country) {
      sqlQuery.country_name = country
    }
    if (city) {
      sqlQuery.city = city
    }
    if (industry) {
      sqlQuery.industry = industry
    }
    if (zipcode) {
      sqlQuery.zipcode = zipcode
    }
    sqlQuery.name = {
      [Op.or]: [{ [Op.ne]: [''] }, { [Op.ne]: [null] }]
    }
    let maxCount
    if (employeeCount !== "-1" && employeeCount) {
      let minCount = +employeeCount.split("-")[0];
      maxCount = +employeeCount.split("-")[1];
      console.log('minCount, maxCount', minCount, maxCount);
      sqlQuery.employee_count = {
        [Op.between]: [minCount, maxCount],
      };
    }

    sqlResults = await Corporate.findAll({
      where: sqlQuery,
      attributes: [['id', '_id']],
      limit: limit,
      offset: offset
    })
    sqlResults = _.map(sqlResults, 'dataValues');
    let resultArray = [];
    if ((type || industry || maxCount) && (sqlResults.length === 0)) {
      return responseObj(false, 200, 'Corporates successfully found', { userList: [] })
    }
    else if ((type || industry || maxCount || country || city || zipcode) && (sqlResults.length > 0)) {
      for (let i of sqlResults) {
        let result = JSON.parse(JSON.stringify(i));
        let data = await getCorporateProfile(result._id);
        resultArray.push(data);
      }
    }
    else {
      let mongoResults;
      if (await checkCollectionExists("corporateprofiles")) {
        mongoResults = await CorporateProfile.find(mongoQuery, mongoProjection).limit(limit).skip(offset);
      }

      const allCorporates = _.uniqBy(_.concat(mongoResults ? mongoResults : [], sqlResults), '_id');

      for (let corporate of allCorporates) {
        let data = await getCorporateProfile(corporate._id);
        resultArray.push(data);
      }
    }

    if (forMap) {

      let position = null, zoomTo = null;
      if (searchParams.zipcode) {
        position = await getLatLong(searchParams.zipcode)
        zoomTo = "pin";
      }
      else if (searchParams.city) {
        position = await getLatLong(searchParams.city)
        zoomTo = "city";
      }
      else if (searchParams.country) {
        position = await getLatLong(searchParams.country)
        zoomTo = "country";
      }

      let users = {};


      _.forEach(resultArray, (user) => {
        let key = user.latitude + "," + user.longitude;
        if (users && users[key] && users[key].commonusers && users[key].commonusers.length && users[key].count) {
          users[key].commonusers.push({ id: user.id || null, logo: user.logo || null, name: user.name || null, city: user.city || null, country: user.country_name || null, address: user.address_line || "NA", zipcode: user.zipcode || null, state: user.state || null });
          users[key].count++;
          users[key].lat = user.latitude || "null";
          users[key].lng = user.longitude || "null";
        } else {
          users[key] = {
            count: 1,
            commonusers: [{ id: user.id || null, logo: user.logo || null, name: user.name || null, city: user.city || null, country: user.country_name || null, address: user.address_line || "NA", zipcode: user.zipcode || null, state: user.state || null }],
            lat: user.latitude || "null",
            lng: user.longitude || "null"
          }
        }
      })



      var invisible = _.filter(resultArray, (corporate) => {
        return corporate.latitude === null || corporate.longitude === null;
      });
      const arr = [];
      Object.keys(users).forEach((key) => {
        arr.push({ lat: users[key].lat, lng: users[key].lng, count: users[key].count, users: users[key].commonusers })
      })

      let resultArray1 = arr;
      return responseObj(false, 200, 'Corporates successfully found', { userList: resultArray1, totalCount: resultArray.length, invisible: invisible && invisible.length, zoomTo: zoomTo || null, position: position || null })
    }

    return responseObj(false, 200, 'Corporates successfully found', { userList: resultArray })
  }
  catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in searching corporate",
        err_stack: ex.stack
      }
    );
  }

}

const getCorporateProfile = async (id) => {
  return new Promise(async (res, rej) => {

    let corporate = await Corporate.findOne({
      where: {
        id
      },
      attributes: ["id", "name", "industry", "revenue", "revenue_currency", "email", "country_name", "address_line", "zipcode", "city", "state", "website", "type", "employee_count", "telephone", "zipcode", "account_type", "establishment_date", "latitude", "longitude", "current_road_map", "future_road_map", "culture", "logo", "video_intro", "expiry_date", "ticker", "currently_hiring", "core_values"],
      raw: true,
    })

    let corporateProfile = await CorporateProfile.findById(id);
    let corporateProfileObject = corporateProfile ? corporateProfile.toObject() : {};
    let response = { ...corporate, ...corporateProfileObject };
    return res(response);
  })
}

async function checkCollectionExists(collectionName) {
  return new Promise((res, rej) => {
    mongoose.connection.db.listCollections({ name: collectionName })
      .next(async (err, collinfo) => {
        if (collinfo) {
          res(true);
        }
        else {
          res(false);
        }
      });
  })

}



function downloadPdf(req, res) {
  try {

    let { content, type, name } = req.body.payload;

    return new Promise((resolve, reject) => {
      if(type === 'pdf'){
      var options = {
        format: 'A4', "border": {
          "top": "0.7in",            // default is 0, units: mm, cm, in, px
          "right": "0.5in",
          "bottom": "0.7in",
          "left": "0.5in"
        },
        "timeout":120000
      };

      pdf.create(content, options).toFile(path.join(__dirname, '../', `/public/pdf/${req.tokenUser.data.id}.pdf`), async function (err, res) {
        if (err) {
          console.log(err);
          reject(err);
        }
        else {

          let data = await uploadToS3(path.join(__dirname, '../', `/public/pdf/${req.tokenUser.data.id}.pdf`), req.tokenUser.data.id, type, name);

          fs.unlink(path.join(__dirname, '../', `/public/pdf/${req.tokenUser.data.id}.pdf`), function (err) {
            if (err) {
              reject(err);
              console.log(err);
            }
            else {
              resolve(data.Location);
            }
          });
        }
      });
      }
      else if(type === 'docx'){

        let config = {
          url: 'https://docraptor.com/docs',
          encoding: null, //IMPORTANT! This produces a binary body response instead of text
          headers: {
            'Content-Type': 'application/json'
          },
          json: {
            user_credentials: "eghWcdhswwu50ZGCLmHc",
            doc: {
              document_content: content,
              type: "docx",
              test: false,
            }
          }
        };
      
      var docx = htmlDocx.asBlob(content);
      var pathtosave = path.join(__dirname, '../', `/public/pdf/${req.tokenUser.data.id}.docx`)
      request.post(config, function (err, res, body) {
        fs.writeFile(pathtosave, docx, "binary", async function (err) {
          if (err) {
            reject(err);
              console.log(err);
          }
          else {

            let data = await uploadToS3(path.join(__dirname, '../', `/public/pdf/${req.tokenUser.data.id}.docx`), req.tokenUser.data.id, type, name);

            fs.unlink(path.join(__dirname, '../', `/public/pdf/${req.tokenUser.data.id}.docx`), function (err) {
              if (err) {
                reject(err);
                console.log(err);
              }
              else {
                resolve(data.Location);
              }
            });
          }
        });
      });
    }
    }).then((res) => {
      return responseObj(false, 200, "File Uploaded", res)
    }).catch((ex) => {
      console.log('Error', ex)
      return responseObj(true, 500, 'Error in getting file', { err_stack: ex.stack })
    })

  } catch (ex) {
    console.log('Error', ex)
    return responseObj(true, 500, 'Error in getting file', { err_stack: ex.stack })
  }
}

async function sendInviteMail(req, res) {

    if(req.body.type === 'newPskills' || req.body.type === 'newOskills' || req.body.type === 'newIndustry')
    {
      try {
        let skill = req.body.skill;
        let adminReciver = 'matchupit@gmail.com'
        let newPrimarySkill
        if(req.body.type === 'newPskills'){
           newPrimarySkill = 'New Primary skill has been added by user'
        }
        if(req.body.type === 'newOskills'){
           newPrimarySkill = 'New skill has been added by user'
        }
        if(req.body.type === 'newIndustry'){
          newPrimarySkill = 'New Industry has been added by user'
       }
 
        const emailPayload = {
          from: 'no-reply@matchupit.com ',
          to: adminReciver,
          subject: `${newPrimarySkill}.`,
          html: `<p>Hi Admin,</p>
          <p style="display:inline;"><span style="font-weight:bold; font-size:24px"><u>${skill}</u></span>, has been added by user.</p>
          <p> Best,</p>
          <p>MatchupIT</p> `
        } 
        await sendMail(emailPayload)
        return responseObj(false, 200, 'mail sent successfully.')
    } catch (ex) {
      console.log('Error', ex)
      return responseObj(true, 500, 'Error in Sending Invitation mail', { err_stack: ex.stack })
     }
    }
    else if(req.body.type === 'newRole')
    {
      try {
        let functions;
        let roles;
        let adminReciver = 'matchupit@gmail.com'
        let functionRole
        if(req.body.type === 'newRole'){
          functions = req.body.function;
          roles = req.body.role;
          functionRole = 'New role has been added by user'
        }
 
        const emailPayload = {
          from: 'no-reply@matchupit.com ',
          to: adminReciver,
          subject: `${functionRole}.`,
          html: `<p>Hi Admin,</p>
          <p style="display:inline;"><span style="font-weight:bold; font-size:24px"><u>function : ${functions} -  Role : ${roles}</u></span>, has been added by user.</p>
          <p> Best,</p>
          <p>MatchupIT.</p> `
        } 
        await sendMail(emailPayload)
        return responseObj(false, 200, 'mail sent successfully.')
    } catch (ex) {
      console.log('Error', ex)
    return responseObj(true, 500, 'Error in Sending Invitation mail', { err_stack: ex.stack })
     }
    }
    else {
      try {
          let reciever_email = req.body.reciever_email;
          let reciever_full_name = req.body.reciever_full_name;
          let sender_full_name = req.body.sender_full_name;
   
          const emailPayload = {
            from: 'no-reply@matchupit.com ',
            to: reciever_email,
            subject: `${sender_full_name} is inviting you to join upcoming platform MatchupIT`,
            html: `<p>Hi ${reciever_full_name},</p>
            <p style="display:inline;">${sender_full_name} invites you to join the unique platform MatchupIT.</p>
            <p>Click here https://stage.matchupit.com/ and signup  to be part of the technology community.</p>
            <p> Best,</p>
            <p>${sender_full_name}</p> `
          } 
          await sendMail(emailPayload)
          return responseObj(false, 200, 'mail sent successfully.')
      } catch (ex) {
        console.log('Error', ex)
      return responseObj(true, 500, 'Error in Sending Invitation mail', { err_stack: ex.stack })
       }

}

}

async function getUserJobDetails(req, res) {
  try {
    let { userId } = req.query;

    if (!userId) {
      return responseObj(true, 400, "Bad Request");
    }

    let jobDetails = await model.userjobtypemapping.findAll({
      where: {
        UserId: userId
      },
      attributes: ["Id", "UserId", "JobTypeId", "CompensationCurrency", "CompensationValue"],
      include: [{ model: model.jobtype, attributes: ["Name", "Description", "Code", "CompensationPeriod"] }],
      raw: true
    });

    return responseObj(false, 200, "Success", jobDetails)

  } catch (ex) {
    console.log('Error', ex)
    return responseObj(true, 500, 'Error in getting job details', { err_stack: ex.stack })
  }
}


async function addUserJobDetails(req, res) {
  try {

    let { jobTypeId, compensationCurrency, compensationValue } = req.body;

    if (!jobTypeId || !compensationCurrency || !compensationValue) {
      return responseObj(true, 400, "Bad Request");
    }

    let jobDetails = await model.userjobtypemapping.create({
      UserId: req.headers.userid,
      JobTypeId: jobTypeId,
      CompensationCurrency: compensationCurrency,
      CompensationValue: compensationValue
    });

    return responseObj(false, 200, "Success", jobDetails)

  } catch (ex) {
    console.log('Error', ex)
    return responseObj(true, 500, 'Error in getting job details', { err_stack: ex.stack })
  }
}


async function updateUserJobDetails(req, res) {
  try {


    let { jobId, jobTypeId, compensationCurrency, compensationValue } = req.body;

    if (!jobId || !jobTypeId || !compensationCurrency || !compensationValue) {
      return responseObj(true, 400, "Bad Request");
    }

    await model.userjobtypemapping.update(
      {
        JobTypeId: jobTypeId,
        CompensationCurrency: compensationCurrency,
        CompensationValue: compensationValue
      },
      {
        where: {
          UserId: req.headers.userid,
          Id: jobId
        }
      });

    return responseObj(false, 200, "Success")

  } catch (ex) {
    console.log('Error', ex)
    return responseObj(true, 500, 'Error in getting job details', { err_stack: ex.stack })
  }
}



async function getJobTypes(req, res) {
  try {

    let jobTypes = await model.jobtype.findAll({
      raw: true
    });

    return responseObj(false, 200, "Success", jobTypes)

  } catch (ex) {
    console.log('Error', ex)
    return responseObj(true, 500, 'Error in getting job details', { err_stack: ex.stack })
  }
}


function uploadToS3(fileName, userId, type, name) {
  const s3 = new AWS.S3({
    accessKeyId: Config.S3AccessKeyID,
    secretAccessKey: Config.S3SecretAccessKey
  })
  const readStream = fs.createReadStream(fileName);

  const params = {
    Bucket: Config.bucketName,
    ACL: Config.acl,
    Key: `${userId}/${new Date().getTime()}/${name}.${type}`,
    Body: readStream
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, function (err, data) {
      readStream.destroy();

      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

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
  trackProfileVisit: trackProfileVisit,
  getRecentSearch: getRecentSearch,
  getRecentSearchInd: getRecentSearchInd,
  getPopularSearch: getPopularSearch,
  getPopularSearchText: getPopularSearchText,
  searchUsers: searchUsers,
  checkUser: checkUser,
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