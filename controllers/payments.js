const paymentsService = require('../services/payments')
const sendResponse = require('../helpers/response_handler').sendResponse
const _ = require('lodash')
const transaction = require('../models/schemas/transactions');
const User = require('../models/user')
const Corporate = require('../models/corporate')
const models = require('../models/index');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const moment = require('moment');
// const sendMail = require('../helpers/email/sendgrid').sendMail;
const sendMail = require('../helpers/email/email').sendMail

const savePaymentDetails = async (req, res) => {
  try {
    const userId = _.get(req.tokenUser, 'data.id')
    const paymentDetails = req.body.details
    if (!userId) {
      sendResponse({ err: true, responseCode: 401, msg: 'Unauthorized request' }, res)
      return
    }

    await paymentsService.savePaymentDetails(userId, paymentDetails)

    sendResponse({ err: false, responseCode: 200, msg: 'Payment details successfully saved' }, res)

  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in payment', err_stack: ex.stack }, res)
  }
}




// const makePayment1 = async (req, res) => {
//   try {
//     let reqArray = Object.keys(req.body);

//     if (!reqArray.includes("planId") || !reqArray.includes("token") || !reqArray.includes("sessionId")) {
//       sendResponse({ err: true, responseCode: 400, msg: 'card details are mandatory' }, res)
//       return
//     }
//     let user;
//     if (req.headers.userid.startsWith('c-')) {
//       user = await Corporate.findOne({ where: { id: req.headers.userid }, attributes: ["id", "name", "telephone", "country_name", "zipcode", "address_line", "state", "city", "email"], raw: true })
//     }
//     else {
//       user = await User.findOne({ where: { id: req.headers.userid }, attributes: ["id", "first_name", "last_name", "phone", "country_name", "zipcode", "address_line", "state", "city", "email"], raw: true })
//     }
//     if (!user) {
//       return responseObj(true, 401, 'User not registered')
//     }

//     let planDetails = await models.subscriptionplan.findOne({
//       where: {
//         id: req.body.planId
//       },
//       attributes: ["id", "plan_name", "amount", "period_in_months", "currency_code"],
//       raw: true
//     });

//     if (!planDetails) {
//       return responseObj(true, 400, 'Plan is not selected')
//     }

//     let amount = +planDetails["amount"] * 100;


//     stripe.tokens.create(
//       {
//         card: {
//           number: "4242424242424242",
//           exp_month: 12,
//           exp_year: 2021,
//           cvc: "305",
//         },
//       },
//       (err, token) => {
//         // asynchronously called
//         if (err) {
//           console.log('err1', err)
//           if (err.type === "StripeCardError") {
//             return res.status(400).json({
//               err: true, responseCode: 500, msg: err.raw.message
//             })
//           }
//           return res.status(500).json({
//             err: true, responseCode: 500, msg: err.raw.message
//           })
//         }
//         if (token) {



//           stripe.charges.create(
//             {
//               amount: amount,
//               currency: planDetails["currency_code"],
//               source: token.id, //req.body.token,
//               description: 'Making a payment',
//             },
//             async (err, charge) => {
//               if (err) {
//                 if (err.type === "StripeInvalidRequestError") {
//                   return res.status(400).json({
//                     err: true, responseCode: 500, msg: err.raw.message
//                   })
//                 }
//                 return res.status(500).json({
//                   err: true, responseCode: 500, msg: err.raw.message
//                 })
//               }
//               if (charge) {
//                 charge.billing_details.address.city = user.city || ""
//                 charge.billing_details.address.country = user.country_name || ""
//                 charge.billing_details.address.line1 = user.address_line || ""
//                 charge.billing_details.address.state = user.state || ""
//                 charge.billing_details.address.postal_code = user.zipcode || ""
//                 charge.billing_details.email = user.email || ""
//                 charge.billing_details.name = req.headers.userid.startsWith('user-') ? user.first_name ? user.first_name : "" : user.name ? user.name : ""
//                 charge.billing_details.phone = req.headers.userid.startsWith('user-') ? user.phone ? user.phone : '' : user.telephone ? user.telephone : ""
      
//                 let mongoResponse = await transaction.create({
//                   user_id: req.headers.userid,
//                   time_stamp: new Date(),
//                   details: charge
//                 })
      
//                 let orderprefix = req.headers.userid.startsWith('c-') ? "C-" : "U-"
//                 let orderResponse = await models.order.create({
//                   payment_gateway_transaction_id: charge.id,
//                   customer_id: req.headers.userid,
//                   order_status_id: 1,
//                   payment_method: 1,
//                   customer_currency: planDetails["currency_code"],
//                   order_tax: 0,  //change after discussion
//                   order_discount: 0, //change after discussion
//                   order_total: +planDetails["amount"],
//                   ip_address: req.ip,
//                   session_id: req.body.sessionId || '',
//                   payment_response_id: mongoResponse._id.toString()
//                 })

//                 let order_number = "MUIT-" + orderprefix + moment().format("MM") + moment().format("YY") + "-" + orderResponse.id

//                 await models.order.update({order_number:order_number }, {where: {id: orderResponse.id}})
      
      
//                 if (req.headers.userid.startsWith('c-')) {
//                   await Corporate.update({ payment_status: true }, { where: { id: req.headers.userid } })
//                 } else {
//                   await User.update({ payment_status: true }, { where: { id: req.headers.userid } })
//                 }
      
      
//                 await models.orderhistory.create({
//                   order_id: orderResponse.id,
//                   order_status_id: 1,
//                   comments: "success",
//                 })
      
//                 await models.subscription.create({
//                   order_id: orderResponse.id,
//                   user_id: req.headers.userid,
//                   start_date: new Date(),
//                   end_date: moment(new Date(), "DD-MM-YYYY").add(planDetails["period_in_months"], 'days'),
//                   is_disabled: false,
//                   subscription_plan_type: req.body.planId
//                 })
//                 sendResponse({ err: false, responseCode: 200, msg: 'Payment success' }, res)
//               }
//             }
//           );
//         }
//       })

    

//   } catch (ex) {
//     console.log(ex)
//     if (ex.type === "StripeCardError") {
//       sendResponse({ err: true, responseCode: 500, msg: ex.raw.message }, res)
//     }

//     if (ex.type === "StripeInvalidRequestError") {
//       sendResponse({ err: true, responseCode: 500, msg: ex.raw.message }, res)
//     }
//     sendResponse({ err: true, responseCode: 500, msg: 'Error in payment' }, res)
//   }
// }








const makePayment = async (req, res) => {
  try {
    let reqArray = Object.keys(req.body);

    if (!reqArray.includes("planId") || !reqArray.includes("token") || !reqArray.includes("sessionId") || !reqArray.includes("ipAddress")) {
      sendResponse({ err: true, responseCode: 400, msg: 'card details are mandatory' }, res)
      return
    }
    let user;
    if (req.headers.userid.startsWith('c-')) {
      user = await Corporate.findOne({ where: { id: req.headers.userid }, attributes: ["id", "name", "telephone", "country_name", "zipcode", "address_line", "state", "city", "email"], raw: true })
    }
    else {
      user = await User.findOne({ where: { id: req.headers.userid }, attributes: ["id", "first_name", "last_name", "phone", "country_name", "zipcode", "address_line", "state", "city", "email"], raw: true })
    }
    if (!user) {
      return sendResponse({ err: true, responseCode: 401, msg: 'User not registered' }, res);
    }

    let planDetails = await models.subscriptionplan.findOne({
      where: {
        id: req.body.planId
      },
      attributes: ["id", "plan_name", "amount", "period_in_months", "currency_code"],
      raw: true
    });

    if (!planDetails) {
      return sendResponse({ err: true, responseCode: 400, msg: 'Plan is invalid' }, res);
    }

    let amount = +planDetails["amount"] * 100;

    stripe.charges.create(
      {
        amount: amount,
        currency: planDetails["currency_code"],
        source: req.body.token,
        description: 'Making a payment',
      },
      async (err, charge) => {
        if (err) {
          if (err.type === "StripeInvalidRequestError") {
            return res.status(400).json({
              err: true, responseCode: 500, msg: err.raw.message
            })
          }
          return res.status(500).json({
            err: true, responseCode: 500, msg: err.raw.message
          })
        }
        if (charge) {
          charge.billing_details.address.city = user.city || ""
          charge.billing_details.address.country = user.country_name || ""
          charge.billing_details.address.line1 = user.address_line || ""
          charge.billing_details.address.state = user.state || ""
          charge.billing_details.address.postal_code = user.zipcode || ""
          charge.billing_details.email = user.email || ""
          charge.billing_details.name = req.headers.userid.startsWith('user-') ? user.first_name ? user.first_name : "" : user.name ? user.name : ""
          charge.billing_details.phone = req.headers.userid.startsWith('user-') ? user.phone ? user.phone : '' : user.telephone ? user.telephone : ""

          let mongoResponse = await transaction.create({
            user_id: req.headers.userid,
            time_stamp: new Date(),
            details: charge
          })

          let orderprefix = req.headers.userid.startsWith('c-') ? "C-" : "U-"
          let orderResponse = await models.order.create({
            payment_gateway_transaction_id: charge.id,
            customer_id: req.headers.userid,
            order_status_id: 2,
            payment_method: 1,
            customer_currency: planDetails["currency_code"],
            order_tax: 0,  //change after discussion
            order_discount: 0, //change after discussion
            order_total: +planDetails["amount"],
            ip_address: req.body.ipAddress || "",
            session_id: req.body.sessionId || '',
            payment_response_id: mongoResponse._id.toString()
          })

          let order_number = "MUIT-" + orderprefix + moment().format("MM") + moment().format("YY") + "-" + orderResponse.id;

          await models.order.update({ order_number: order_number }, { where: { id: orderResponse.id } })


          if (req.headers.userid.startsWith('c-')) {
            await Corporate.update({ payment_status: true, is_active: true }, { where: { id: req.headers.userid } })
          } else {
            await User.update({ payment_status: true, is_active: true }, { where: { id: req.headers.userid } })
          }


          await models.orderhistory.create({
            order_id: orderResponse.id,
            order_status_id: 2,
            comments: "success",
          })

          let hasAlreadySubscribed = await models.subscription.findOne({
            where: {
              user_id: req.headers.userid,
              // subscription_plan_type: req.body.planId
            },
            order: [
              ['updatedAt', 'DESC']
            ],
            raw: true
          });

          if (hasAlreadySubscribed && hasAlreadySubscribed.end_date > new Date()) {
            await models.subscription.create({
              order_id: orderResponse.id,
              user_id: req.headers.userid,
              start_date: moment(hasAlreadySubscribed.end_date).add(1, 'days'),
              end_date: moment(hasAlreadySubscribed.end_date).add(1, 'days').add(planDetails["period_in_months"], 'days'),
              is_disabled: false,
              subscription_plan_type: req.body.planId
            })

            let response = await models.order.findOne({
              where: { id: orderResponse.id }, include: [
                models.subscription
              ]
            });
            const emailPayload = {
              from: 'no-reply@matchupit.com ',
              to: req.headers.email,
              subject: 'Team matchup IT',
              html: `<p>Dear User,</p>
                     <p>Your transaction has been processed.</p>
                     <h4>Transaction details: </h4>
                     <p>Transaction for the value of: USD ${response["order_total"]}</p>
                     <p>Invoice Number(s): ${order_number}</p>
                     <p>Authorization Date/Time: ${moment().format('MMMM Do YYYY, h:mm:ss a')}</p>
                     <p>Result: <strong>Success</strong></p>
                     <br>
                     <p>Please refer to the contact details on your invoice or your center team.</p>
                     <strong>Thank you for your subscription</strong>
                     <h2 style="color:#308ca6;">matchup|<span style="color:#ab0a1a;">IT</span></h2>`
            }
            await sendMail(emailPayload);
            sendResponse({ err: false, responseCode: 200, msg: 'Payment success', response }, res);
          }
          else {

            await models.subscription.create({
              order_id: orderResponse.id,
              user_id: req.headers.userid,
              start_date: new Date(),
              end_date: moment(new Date(), "DD-MM-YYYY").add(planDetails["period_in_months"], 'days'),
              is_disabled: false,
              subscription_plan_type: req.body.planId
            })

            let response = await models.order.findOne({
              where: { id: orderResponse.id }, include: [
                models.subscription
              ]
            });

            const emailPayload = {
              from: 'no-reply@matchupit.com ',
              to: req.headers.email,
              subject: 'Team matchup IT',
              html: `<p>Dear User,</p>
                     <p>Your transaction has been processed.</p>
                     <h4>Transaction details: </h4>
                     <p>Transaction for the value of: USD ${response["order_total"]}</p>
                     <p>Invoice Number(s): ${order_number}</p>
                     <p>Authorization Date/Time: ${moment().format('MMMM Do YYYY, h:mm:ss a')}</p>
                     <p>Result: <strong>Success</strong></p>
                     <br>
                     <p>Please refer to the contact details on your invoice or your center team.</p>
                     <strong>Thank you for your subscription</strong>
                     <h2 style="color:#308ca6;">matchup|<span style="color:#ab0a1a;">IT</span></h2>`
            }
            await sendMail(emailPayload);
            sendResponse({ err: false, responseCode: 200, msg: 'Payment success', response }, res);
          }

        }
      }
    );

  } catch (ex) {
    console.log(ex)
    if (ex.type === "StripeCardError") {
      sendResponse({ err: true, responseCode: 500, msg: ex.raw.message, err_stack: ex.stack}, res)
    }

    if (ex.type === "StripeInvalidRequestError") {
      sendResponse({ err: true, responseCode: 500, msg: ex.raw.message, err_stack: ex.stack }, res)
    }
    sendResponse({ err: true, responseCode: 500, msg: 'Error in payment', err_stack: ex.stack }, res)
  }
}



const getPlanDetails = async (req, res) => {
  try {
    let plans = await models.subscriptionplan.findAll();

    sendResponse({ err: false, responseCode: 200, plans }, res)

  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in payment', err_stack: ex.stack }, res)
  }
}


const getPaymentDetails = async (req, res) => {
  try {

    let response = await models.order.findAll({
      where: { customer_id: req.headers.userid, order_status_id: 2 },
      include: [
        models.subscription
      ]
    });

    sendResponse({ err: false, responseCode: 200, response }, res)

  } catch (ex) {
    console.log(ex)
    sendResponse({ err: true, responseCode: 500, msg: 'Error in getting payment details', err_stack: ex.stack }, res)
  }
}

module.exports = {
  savePaymentDetails: savePaymentDetails,
  makePayment,
  getPlanDetails,
  getPaymentDetails
}
