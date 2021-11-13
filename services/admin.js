const moment = require('moment')
const _ = require('lodash')
const User = require('../models/user')
const Corporate = require('../models/corporate')
const model = require('../models/index');
const hashHandler = require('../helpers/hash_handler')
const responseObj = require('../helpers/response_handler').responseObj
const meanSalariesMaster = require('../helpers/mean_salaries');
const { x } = require('@hapi/joi');
const Op = require('sequelize').Op
const Industries = require('../models/schemas/industries')
const Skills = require('../models/schemas/skills')
const Roles = require('../models/schemas/roles');
const { identity } = require('lodash');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
// const sendMail = require('../helpers/email/sendgrid').sendMail;
const sendMail = require('../helpers/email/email').sendMail

async function countUsers(searchReq) {
    try {
        let searchParams = searchReq.body
        let cat = searchParams.cat
        let count
        let dategt
        let datelt
        let d = new Date;
        let day = d.getDate()
        let month = d.getMonth()
        let year = d.getFullYear()
        switch(cat) {
            // cases CW, PW, CM, PM, PSM, CY, PY
            case "CW":
                dategt = moment().startOf('week').toDate()
                datelt = moment().add(1,'days').toDate()
                break
            case "PW":
                dategt = moment().startOf('week').subtract(7,'days').toDate()
                datelt = moment().startOf('week').toDate()
                break
            case "CM":
                dategt = moment().startOf('month').add(1,'days').toDate()
                datelt = moment().add(1,'days').toDate()
                break
            case "PM":
                dategt = moment().startOf('month').subtract(1,'months').add(1,'days').toDate()
                datelt = moment().startOf('month').toDate()
                break
            case "PSM":
                dategt = moment().startOf('month').subtract(6,'months').add(1,'days').toDate()
                datelt = moment().startOf('month').toDate()
                break
            case "CY":
                dategt = moment().startOf('year').add(1,'days').toDate()
                console.log(dategt)
                datelt = moment().add(1,'days').toDate()
                break
            case "PY":
                dategt = moment().startOf('year').subtract(1,'years').add(1,'days').toDate()
                datelt =  moment().startOf('year').toDate()
                break
        }
        
        let getDates = function(startDate, endDate) {
            let dates = [],
                currentDate = startDate,
                addDays = function(days) {
                  var date = new Date(this.valueOf());
                  date.setDate(date.getDate() + days);
                  return date;
                };
            while (currentDate < endDate) {
              dates.push(currentDate.toISOString().slice(0,10));
              currentDate = addDays.call(currentDate, 1);
            }
            return dates;
        }

        let getMonths = function(startDate, endDate) {
            let dates = [],
                currentDate = startDate,
                addMonths = function(months) {
                  var date = new Date(this.valueOf());
                  date.setMonth(date.getMonth() + months);
                  return date;
                };
            while (currentDate <= endDate) {
              dates.push(currentDate.toISOString().slice(0,7));
              currentDate = addMonths.call(currentDate, 1);
            }
            return dates;
        }

        let dates
        if(cat==='CY'||cat==='PY'||cat=='PSM')
            dates = getMonths(dategt,datelt)
        else dates = getDates(dategt,datelt)

        let resObj = []

        for(let i=0;i<dates.length;i++){
            
            date = dates[i]
            if(searchReq.body.type === 'individual')
            {
                let uCount = await model.tracking.findAll({
                    where: {
                        createdAt: {
                            [Op.startsWith]: `${date}`
                        }
                    },
                    attributes: ['login', 'search','messenger', 'community', 'news'],
                    raw: true
                })
                if(uCount){
                    let login = 0
                    let search = 0
                    let community = 0
                    let messenger = 0
                    let news = 0
                    for(let j=0;j<uCount.length;j++){
                        login = uCount[j].login + login
                        search = uCount[j].search + search
                        community = uCount[j].community + community
                        messenger = uCount[j].messenger + messenger
                        news = uCount[j].news + news
                    }            
            
                tempObj = [i+1, login,search,messenger,community,news]
                }
                else
                {
                    tempObj = [i+1,0,0,0,0,0]
                }
            }
            else{
            let uCount = await User.count({
                where: {
                    createdAt: {
                        [Op.startsWith]: `${date}`
                    },
                    id: {
                        [Op.like]: 'user-%'
                    }
                },
                attributes: ['createdAt'],
                raw: true
            })

            let cCount = await Corporate.count({
                where: {
                    createdAt: {
                        [Op.startsWith]: `${date}`
                    }
                },
                attributes: ['createdAt'],
                raw: true
            })
            tempObj = [i+1, uCount, cCount]
        }
            resObj.push(tempObj)
        }
        return responseObj(false, 200, 'Count of users fetched', {result: resObj})
    } catch (ex) {
      console.log(ex)
      return responseObj(true, 500, 'Error in fetching count of users',{err_stack: ex.stack})
    }
}

async function paymentStatus(searchReq) {
    try{
        let totalUsers = await User.count({
            where: {
                id: {
                    [Op.like]: 'user-%'
                }
            }
        })

        let paidUsers = await model.subscription.findAll({
            where: {
                end_date: {
                    [Op.gte]: new Date()
                },
                user_id: {
                    [Op.like]: 'user-%'
                },
                subscription_plan_type: {
                    [Op.ne]: 5
                }

            },
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('user_id')) ,'user_id'],
            ]
        })

        // let paidUsers = await User.count({
        //     where: {
        //         payment_status: {
        //             [Op.eq]: 1
        //         }
        //     }
        // })
        let totalCorporates = await Corporate.count({
            where: {
                id: {
                    [Op.like]: 'c-%'
                }
            }
        })
        let paidCorporates = await model.subscription.findAll({
            where: {
                end_date: {
                    [Op.gte]: new Date()
                },
                user_id: {
                    [Op.like]: 'c-%'
                },
                subscription_plan_type: {
                    [Op.ne]: 5
                }

            },
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('user_id')) ,'user_id'],
            ]
        })

        // let paidCorporates = await Corporate.count({
        //     where: {
        //         payment_status: {
        //             [Op.eq]: 1
        //         }
        //     }
        // })
        return responseObj(false, 200, 'Count of users fetched', { totalUsers: totalUsers || 0, paidUsers: paidUsers.length || 0, totalCorporates: totalCorporates || 0, paidCorporates: paidCorporates.length || 0 })


    } catch (ex) {
      console.log(ex)
      return responseObj(true, 500, 'Error in fetching count of users',{err_stack: ex.stack})
    }
}

async function updateSchema(searchReq) {
    try{
        let searchParams = searchReq.body
        let schema = searchParams.schema
        let doc
        if(schema === 'industries') {
            doc = await Industries.findOne()
            doc.overwrite({industries: searchParams.payload})
            await doc.save();
        }
        if(schema === 'roles') {
            doc = await Roles.findOne()
            doc.overwrite({functions: searchParams.payload})
            await doc.save();
        }
        if(schema === 'skills') {
            doc = await Skills.findOne()
            doc.overwrite({skills: searchParams.payload})
            await doc.save();
        }
        return responseObj(false, 200, 'Schema updated', {})
    } catch (ex) {
      console.log(ex)
      return responseObj(true, 500, 'Error in updating schema',{err_stack: ex.stack})
    }
}



async function getRevenue(req, res) {
    try {

        let corporateRevenueTotal = await model.order.findAll({
            where: {
                customer_id: {
                    [Op.like]: 'c-%'
                }
            },
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('order_total')), 'total_amount'],
            ],
            raw: true
        });

        let userRevenueTotal = await model.order.findAll({
            where: {
                customer_id: {
                    [Op.like]: 'user-%'
                }
            },
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('order_total')), 'total_amount'],
            ],
            raw: true
        });
        let monthStartDate = moment().startOf('month').format("YYYY-MM-DD");
        let monthendDate = moment().endOf('month').format("YYYY-MM-DD");

        let corporateRevenueByMonth = await model.order.findAll({
            where: {
                customer_id: {
                    [Op.like]: 'c-%'
                },
                updatedAt: {
                    [Op.between]: [monthStartDate, monthendDate]
                }
            },
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('order_total')), 'total_amount'],
            ],
            raw: true
        });

        let userRevenueByMonth = await model.order.findAll({
            where: {
                customer_id: {
                    [Op.like]: 'user-%'
                },
                updatedAt: {
                    [Op.between]: [monthStartDate, monthendDate]
                }
            },
            attributes: [
                [Sequelize.fn('sum', Sequelize.col('order_total')), 'total_amount'],
            ],
            raw: true
        });

        return responseObj(false, 200, 'Revenue fetched', { corporateRevenueTotal: corporateRevenueTotal[0].total_amount || 0, userRevenueTotal: userRevenueTotal[0].total_amount || 0, corporateRevenueByMonth: corporateRevenueByMonth[0].total_amount || 0, userRevenueByMonth: userRevenueByMonth[0].total_amount || 0 })

    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in getting revenue',{err_stack: ex.stack})
    }
}



async function getAboutToExpireUsers(req, res) {
    try {

        let corporateData = await model.subscription.findAll({
            where: {
                user_id: {
                    [Op.like]: 'c-%'
                },
                end_date: {
                    [Op.between]: [moment(), moment().add(15, 'days')]
                }
            },
            raw: true
        });

        let corporates = [];

        for (let cUser of corporateData) {
            let user = await Corporate.findOne({
                where: {
                    id: cUser.user_id
                },
                attributes: ["name", "email"],
                raw: true
            })
            if(user["name"] === null) user["name"] = "Guest User"
            if (user) {
                corporates.push({ name: user.name, email: user.email, expiryDate: cUser.end_date })
            }
        }

        let userData = await model.subscription.findAll({
            where: {
                user_id: {
                    [Op.like]: 'user-%'
                },
                end_date: {
                    [Op.between]: [moment(), moment().add(15, 'days')]
                }
            },
            raw: true
        });

        let users = [];
        for (let user of userData) {
            let data = await User.findOne({
                where: {
                    id: user.user_id
                },
                attributes: ["first_name", "last_name", "email"],
                raw: true
            })
            if (data) {
                if(data["first_name"] === null) data["first_name"] = "Guest User"
                if(data["last_name"] === null) data["last_name"] = ""
                users.push({ name: _.trim(data.first_name + " " + data.last_name), email: data.email, expiryDate: user.end_date })
            }
        }

        return responseObj(false, 200, 'Users fetched', { corporateData: _.sortBy(corporates, ["expiryDate"], ["asc"]), userData: _.sortBy(users, ["expiryDate"], ["asc"]) })

    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in fetching users revenue',{err_stack: ex.stack})
    }
}

async function getReport(searchReq) {
    try {
        let resArray = []
        let result = await model.order.findAll({
            attributes: ['order_number', 'payment_gateway_transaction_id', 'customer_id'],
            raw: true
        })
        for (let i = 0; i < result.length; i++) {
            let resObj = {}
            let res = result[i]

            resObj.orderNumber = res.order_number
            resObj.StripeTransactionId = res.payment_gateway_transaction_id
            resObj.id = res.customer_id
            let id = res.customer_id
            let flag = false
            let user = await User.findOne({
                where: { id: id }
            })
            if (!user) {
                user = await Corporate.findOne({
                    where: { id: id }
                })
                flag = true
            }

            if (user) {
                if (flag) {
                    resObj.UserName = user.dataValues.name ? user.dataValues.name : "Guest User";
                }
                else {
                    if (user.dataValues.first_name === null) user.dataValues.first_name = "Guest User";
                    if (user.dataValues.last_name === null) user.dataValues.last_name = "";
                    resObj.UserName = _.trim(user.dataValues.first_name + " " + user.dataValues.last_name);

                }
                resObj.UserType = user.dataValues.account_type
                resObj.UserEmail = user.dataValues.email
                resObj.id = user.dataValues.id
                resObj.is_Active = user.dataValues.is_active 
                resObj.admin_Reason = user.dataValues.admin_reason
            }
            let subscriptiondetails = await model.subscription.findOne({
                where: { user_id: id }
            })
            resObj.PlanStartDate = subscriptiondetails && subscriptiondetails.start_date
            resObj.PlanEndDate = subscriptiondetails && subscriptiondetails.end_date
            resObj.PlanValue = subscriptiondetails && subscriptiondetails.subscription_plan_type
            let subplandetails = await model.subscriptionplan.findOne({
                where: { id: resObj.PlanValue },
                raw: true
            })
            resObj.expired = "No"
            if(new Date > resObj.PlanEndDate)
                resObj.expired = "Yes"
            resObj.PlanName = subplandetails && subplandetails.plan_name;



            let respObj = {};
            respObj.orderNumber = res.order_number;
            respObj.transactionId = res.payment_gateway_transaction_id;
            respObj.userId = resObj.id;
            respObj.is_Active = resObj.is_Active
            respObj.admin_Reason = resObj.admin_Reason
            respObj.userName = resObj.UserName;
            respObj.userType = resObj.UserType;
            respObj.userEmail = resObj.UserEmail;
            respObj.plan = resObj.PlanName;
            respObj.planValue = resObj.PlanValue;
            respObj.planStartDate = resObj.PlanStartDate;
            respObj.planEndDate = resObj.PlanEndDate;
            respObj.expired =  resObj.expired;


            resArray.push(respObj)
        }
        return responseObj(false, 200, 'Report fetched', {
            data: resArray, 
            fields: {
                "orderNumber": "Order Number",
                "transactionId": "Transaction Id",
                "userId": "User Id",
                "is_Active": "Status",
                "admin_Reason": "Reason",
                "userName": "Name",
                "userType": "Type",
                "userEmail": "Email",
                "plan": "Plan",
                "planValue": "Value",
                "planStartDate": "Start Date",
                "planEndDate": "End Date",
                "expired": "Expired",
            }
        })
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in fetching report',{err_stack: ex.stack})
    }
}



async function cronJob(req, res) {
    try {

        let expiredUsersQuery = `select distinct s1.user_id from subscriptions s1 where end_date == current_timestamp() and user_Id like 'user-%' and  
        s1.user_id not in(select distinct user_id from subscriptions where end_date >= current_timestamp());`
        const expiredUsers = await model.sequelize.query(expiredUsersQuery, { type: QueryTypes.SELECT, raw: true });

        for (let user of expiredUsers) {
            await User.update({ is_active: false }, { where: { id: user.user_id } })
            let userData = await User.findOne({
                where: {
                    id: user.user_id
                },
                attributes: ["email"],
                raw: true
            })
            const emailPayload = {
                from: 'no-reply@matchupit.com ',
                to: userData.email,
                subject: 'Deactivation of your matchupIT account',
                html: `<p>Dear User,</p>
            <p>Your account has been deactivated due to subscription expiry. Kindly login to <a href='https://matchupit.com/signin' target='_blank'>matchupit.com/signin</a> and renew your subscription to continue using all features of matchupit.</p>`
            }
            await sendMail(emailPayload);
        }


        let expiredCorporatesQuery = `select distinct s1.user_id from subscriptions s1 where end_date == current_timestamp() and user_Id like 'c-%' and  
        s1.user_id not in(select distinct user_id from subscriptions where end_date >= current_timestamp());`
        const expiredCorporates = await model.sequelize.query(expiredCorporatesQuery, { type: QueryTypes.SELECT, raw: true });

        for (let user of expiredCorporates) {
            await Corporate.update({ is_active: false }, { where: { id: user.user_id } })
            let corporateData = await Corporate.findOne({
                where: {
                    id: user.user_id
                },
                attributes: ["email"],
                raw: true
            })
            const emailPayload = {
                from: 'no-reply@matchupit.com ',
                to: corporateData.email,
                subject: 'Deactivation of your matchupIT account',
                html: `<p>Dear User,</p>
            <p>Your account has been deactivated due to subscription expiry. Kindly login to <a href='https://matchupit.com/signin' target='_blank'>matchupit.com/signin</a> and renew your subscription to continue using all features of matchupit.</p>`
            }
            await sendMail(emailPayload);
        }
        return responseObj(false, 200, 'Job completed')
    }
    catch (err) {
        console.log('error', err)
        return responseObj(true, 500, 'Error in running cron job report', { err_stack: err.stack })
    }
}

module.exports = {
    countUsers: countUsers,
    paymentStatus: paymentStatus,
    updateSchema: updateSchema,
    getRevenue,
    getAboutToExpireUsers,
    getReport: getReport,
    cronJob
}