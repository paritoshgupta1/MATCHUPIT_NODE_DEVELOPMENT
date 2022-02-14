const UserModel = require('../models/user')
const UserProfileSchema = require('../models/schemas/user_profiles')
const generateId = require('../helpers/id_generator').generateId
const responseObj = require('../helpers/response_handler').responseObj
const generateJWT = require('../helpers/jwt').generateJWT
const model = require('../models/index');
const moment = require('moment')
const User = require('../models/user')
const sendMail = require('../helpers/email/email').sendMail

async function socialAccountHandler (user) {
  try {
    // check if user exists
    let userRec = await UserModel.findOne({ where: { email: user.email } })
    if (userRec) {
      userRec = userRec.dataValues;
    } else {
      // create user
      const userId = generateId('user')
      userRec = {
        id: userId,
        email: user.email,
        email_verified: true,
        profile_pic: user.profilePic,
        account_type: 'individual',
        first_name: user.firstName,
        last_name: user.lastName
      }
      await UserModel.create(userRec)
      await UserProfileSchema.create({ _id: userId, additional_info: { socialId: user.socialId, social_type:user.socialType } })
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

          await model.orderhistory.create({
            order_id: orderResponse.id,
            order_status_id: 2,
            comments: "success",
          })

          await model.subscription.create({
            order_id: orderResponse.id,
            user_id: userId,
            start_date: new Date(),
            end_date: moment(new Date(), "DD-MM-YYYY").add(24, 'months'),
            is_disabled: false,
            subscription_plan_type: 5
          })
          const emailPayload = {
            from: 'no-reply@matchupit.com ',
            to: userRec.email,
            subject: 'matchupIT sign up',
            html: `<p>Dear User,</p>
            <p>You have registered ${userRec.email} with MatchupIt as an individual user. Please provide/update your information and explore all the features. Your account will be active for 24 months. Subscribe for a suitable plan to have an uninterrupted access to the platform.</p>`
          }
          await sendMail(emailPayload);
    }
      const userObj = {}
      userObj.email = userRec.email
      userObj.id = userRec.id
      userObj.email_verified = userRec.email_verified
      userObj.account_type = userRec.account_type
      userObj.token = generateJWT(userObj)
      await User.update({ is_login: 0 }, { where: { id: userRec.id } })
      return responseObj(false, 200, 'Success', userObj)
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in social handling',{err_stack: ex.stack})
      }
}
module.exports = {
  socialAccountHandler: socialAccountHandler
}
