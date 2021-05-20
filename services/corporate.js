const { Op } = require('sequelize');
const _ = require('lodash');
const sendResponse = require('../helpers/response_handler').sendResponse;
const responseObj = require('../helpers/response_handler').responseObj;
const Corporate = require('../models/corporate');
const CorporateTags = require('../models/schemas/corporate_tags');
const models = require('../models/index');
const CorporateProfile = require('../models/schemas/corporate_profiles');
const sequelize = require('sequelize')
const sendMail = require('../helpers/email/email').sendMail;
// const sendMail = require('../helpers/email/sendgrid').sendMail
const Cryptr = require('cryptr');
const cryptr = new Cryptr('7a51e7ac-7504-4158-95d3-b3f023c51534');
const User = require('../models/user');
const idGenerator = require('../helpers/id_generator').generateId
const getLatLong = require('../helpers/zipcode_to_latLong');
const { mongoose } = require('../db');
const UserProfile = require('../models/schemas/user_profiles')

const searchCorporate = async (searchReq, res, forMap) => {
    let reqObj = searchReq.body
    let { searchText, pageNo, type, country, city, industry, employeeCount, zipcode, name, same } = reqObj;
    try {
        const page = pageNo || 1;
        const limit = (forMap) ? 10000 : 10;
        const offset = (forMap) ? 0 : (page - 1) * limit;
        let sqlResults = [];
        let sqlQuery, mongoProjection, mongoQuery
        searchText = searchText.trim();
        if (searchText && same) {
            const serviceResponse = await searchUsers(searchReq, forMap)
            return sendResponse(serviceResponse, res);
        }
        else {

            if (searchText) {

                if (name) {
                    sqlQuery = {
                        [Op.and]: [
                            {
                                [Op.or]: [
                                    {
                                        name: {
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
                }
                else {
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

                const recent_10 = await models.Searchhistorycorp.findAll({
                    where: { userid: searchReq.headers.userid },
                    raw: true,
                    limit: 10,
                    order: [['updatedAt', 'DESC']]
                })

                const recent = recent_10.find(isPresent)
                if (recent) {
                    await models.Searchhistorycorp.destroy({ where: { userid: recent.userid, searchtext: recent.searchtext } })
                }
                await models.Searchhistorycorp.create(recentObj)
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



const tagUser = async (req, res) => {
    try {

        const { individualId, comments, shortlisted, favourite } = req.body;
        let keys = Object.keys(req.body);
        if (!keys.includes("individualId")) {
            return responseObj(true, 400, 'userId are mandatory')
        }
        // if(!comments && !shortlisted && !favourite) {
        //     return responseObj(true, 400, 'Bad Request')
        // }
        if (keys.includes("shortlisted") || keys.includes("favourite") || keys.includes("comments")) {
            const { userid } = req.headers;

            let masterId = await models.corporatemastermapping.findOne({
                where: {
                    subId: userid,
                },
                attributes: ["corporateId", "name"],
                raw: true,
            });


            let master_id = masterId.corporateId === userid ? masterId.corporateId : userid;

            let isExists = await CorporateTags.findOne({
                individualId, corporateId: master_id, masterId: masterId.corporateId
            })

            if (isExists && keys.includes("comments")) {
                let obj = {};
                if (keys.includes("shortlisted")) {
                    obj.shortlisted = shortlisted
                }
                if (keys.includes("favourite")) {
                    obj.favourite = favourite
                }
                if(!_.isEmpty(obj)){
                    await CorporateTags.findOneAndUpdate({ individualId, corporateId: master_id, masterId: masterId.corporateId }, obj)
                }
                let commentObj = {
                    comment: comments && comments.trim(),
                    createdOn: new Date()
                }
                let response = await CorporateTags.findOneAndUpdate({ individualId, corporateId: master_id, masterId: masterId.corporateId }, { $push: { comments: commentObj } }, {new: true});
                response = response.toJSON();
                let res = response.comments.slice(-1)[0];
                res.name = masterId.name && masterId.name;
                return responseObj(false, 200, 'User tagged', res);
            }
            else if (isExists) {
                let obj = {};
                if (keys.includes("shortlisted")) {
                    obj.shortlisted = shortlisted
                }
                if (keys.includes("favourite")) {
                    obj.favourite = favourite
                }
                if (keys.includes("comments")) {
                    obj.comments = {
                        comment: comments && comments.trim(),
                        createdOn: new Date()
                    }
                }
                await CorporateTags.findOneAndUpdate({ individualId, corporateId: master_id, masterId: masterId.corporateId }, obj)

            }
            else {
                let obj = {
                    individualId,
                    corporateId: master_id,
                    masterId: masterId.corporateId,
                    createdOn: new Date(),
                    comments: {
                        comment: comments && comments.trim(),
                        createdOn: new Date()
                    },
                    shortlisted,
                    favourite
                }
                let response = await CorporateTags.create(obj);
                response = response.toJSON()
                let res = response.comments[0];
                res.name = masterId.name &&  masterId.name;
                return responseObj(false, 200, 'User tagged', res);

            }

            return responseObj(false, 200, 'User tagged')
        }
        else {
            return responseObj(true, 400, 'Bad Request')
        }

    }
    catch (ex) {
        console.log(ex);
        return sendResponse(
            {
                err: true,
                responseCode: 500,
                msg: "error in tagging user",
                err_stack: ex.stack
            }
        );
    }
}

    async function trackProfileVisit(searchReq) {
        try {
            let corpId = searchReq.body.userId
            let userId = searchReq.headers.userid
            let obj = { userId: userId, corpId: corpId }
            let findentry = await models.ProfileVisitscorp.findOne({ where: {userId: userId, corpId: corpId } })
            if (findentry) {
            await models.ProfileVisitscorp.update(obj, { where: {userId: userId, corpId: corpId } })
            }
            else {
            await models.ProfileVisitscorp.create(obj)
            }
            // const corpInfo = await getCorporateProfile(corpId)
            const corpInfo = await getProfile(corpId, 'corporate', true);
            return responseObj(false, 200, 'Tracked Profile Visit', { corpId: corpId, corpProfile: corpInfo.response })
        } catch (ex) {
            console.log(ex)
            return responseObj(true, 500, 'Error in finding profile',{err_stack: ex.stack})
        }
    }
        
    async function getRecentSearch(searchReq) {
        try {
            let userid = searchReq.headers.userid
            let recents = await models.Searchhistorycorp.findAll(
            {
                where: { userid: userid },
                limit: 10,
                raw: true,
                order: [['updatedAt','DESC']]
            })
            return responseObj(false, 200, 'Recent Searches Fetched', {recentsearch: recents})
        } catch (ex) {
            console.log(ex)
            return responseObj(true, 500, 'Error in fetching recent searches',{err_stack: ex.stack})
        }
    }
    
    async function getRecentProfile(searchReq) {
    try {
        let userId = searchReq.headers.userid
        let recents = await models.ProfileVisitscorp.findAll({
            attributes: ['corpId'],
            where: {userId: userId},
            order: [['updatedAt','DESC']],
            raw: true,
            limit: 10
        })
        for(let i=0;i<recents.length;i++) {
        let details = await getCorporateProfile(recents[i].corpId)
        recents[i].details = details
        }
        return responseObj(false, 200, 'Recent Searches Fetched', {recentsearch: recents})
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in fetching Recent searches',{err_stack: ex.stack})
    }
    }
    
    async function getPopularProfile(searchReq) {
    try {
        let recents = await models.ProfileVisitscorp.findAll({
        attributes: ['corpId', [sequelize.fn('count', sequelize.col('corpId')), 'cnt']],
        group: ['corpId'],
        raw: true
        })
        let ordered = recents.sort((a, b)=> {
        let c = a.cnt
        let d = b.cnt;
        return d-c;
    });
        for(let i=0;i<ordered.length;i++) {
        let details = await getCorporateProfile(ordered[i].corpId)
        ordered[i].details = details
        }
        
        return responseObj(false, 200, 'Popular Searches Fetched', {popularsearch: ordered})
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in fetching popular searches',{err_stack: ex.stack})
    }
    }
    
    async function getPopularText(searchReq) {
    try {
    
        let recents = await models.Searchhistorycorp.findAll({
        attributes: ['searchtext', [sequelize.fn('count', sequelize.col('searchtext')), 'cnt']],
        group: ['searchtext'],
        raw: true
        })
    
        let ordered = recents.sort((a, b)=> {
        let c = a.cnt
        let d = b.cnt;
        return d-c;
        })
        return responseObj(false, 200, 'Popular searchtext Fetched', {popularsearch: ordered})
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in fetching popular searchtext',{err_stack: ex.stack})
    }
}


const addCorporateMember = async (req, res) => {
    if (!req.body.email) {
        return responseObj(
            true, 400, "email is mandatory"
        );
    }
    let corpName = await Corporate.findOne({
        where: {
            id: req.headers.userid
        },
        attributes: ["name"]
    })
    let respObj = {};

    try {

        let isAlreadyMember = await models.corporatemastermapping.findOne({ where: { email: req.body.email, is_active: true } });

        if (isAlreadyMember) {
            return responseObj(true, 400, 'User already registered')
        }

        let subIdDetails = await models.corporatemastermapping.findOne({ where: { corporateId: req.headers.userid, email: req.body.email }, raw: true });


        if (subIdDetails && subIdDetails["corporateId"] === req.headers.userid) {
            // await models.corporatemastermapping.update({ is_active: true }, { where: { corporateId: req.headers.userid, email: req.body.email } });
            const user = await User.findOne({ where: { email: req.body.email }, attributes: ["id", "email", "first_name", "last_name"], raw: true })
            if (user) {
                let encryptPayload = {
                    corporateId: req.headers.userid,
                    email: req.body.email,
                    account_type: "corporate"
                }
                const encryptedString = cryptr.encrypt(JSON.stringify(encryptPayload));

                let link = `<a href="https://matchupit.com/signin?authorization=${encryptedString} target="_blank">https://matchupit.com/signin</a>`
                const emailPayload = {
                    from: 'no-reply@matchupit.com ',
                    to: req.body.email,
                    subject: 'matchupIT Login',
                    // html: `<a href="https://matchupit.com/signin?authorization=${encryptedString} target="_blank">https://matchupit.com/signin</a>`
                    html: `<p>Dear User,</p>
                <p>You have been invited by ${corpName["name"]} to join matchupit as its member. Kindly click the link given below and proceed to your onboarding.</p>
                <p>${link}</p>`

                }
                respObj.subId = user.id;
                respObj.corporateId = req.headers.userid;
                respObj.is_active = 0;
                respObj.is_master = 0;
                respObj.email = req.body.email;
                await sendMail(emailPayload);
                return responseObj(false, 200, 'Email successfully sent', respObj)
            }
        }

        const corporate = await Corporate.findOne({ where: { email: req.body.email } })
        if (corporate) {
            return responseObj(true, 400, 'User already registered as another corporate')
        }

        const user = await User.findOne({ where: { email: req.body.email }, attributes: ["id", "email", "first_name", "last_name"], raw: true })
        if (user) {
            let encryptPayload = {
                corporateId: req.headers.userid,
                email: req.body.email,
                account_type: "corporate"
            }
            // const encryptedString = cryptr.encrypt(`corporateId=${req.headers.userid}&email=${req.body.email}`);
            const encryptedString = cryptr.encrypt(JSON.stringify(encryptPayload));

            let link = `<a href="https://matchupit.com/signin?authorization=${encryptedString} target="_blank">https://matchupit.com/signin</a>`
            await models.corporatemastermapping.create({
                corporateId: req.headers.userid,
                name: user.first_name + ' ' + user.last_name,
                subId: user.id,
                email: req.body.email,
                is_master: false,
                is_active: false
            });

            const emailPayload = {
                from: 'no-reply@matchupit.com ',
                to: req.body.email,
                subject: 'matchupIT Login',
                // html: `<a href="https://matchupit.com/signin?authorization=${encryptedString} target="_blank">https://matchupit.com/signin</a>`
                html: `<p>Dear User,</p>
                <p>You have been invited by ${corpName["name"]} to join matchupit as its member. Kindly click the link given below and proceed to your onboarding.</p>
                <p>${link}</p>`

            }
            respObj.subId = user.id;
            respObj.corporateId = req.headers.userid;
            respObj.is_active = 0;
            respObj.is_master = 0;
            respObj.email = req.body.email;
            await sendMail(emailPayload);
        }
        else {
            let encryptPayload = {
                corporateId: req.headers.userid,
                email: req.body.email,
                account_type: "individual"
            }
            // const encryptedString = cryptr.encrypt(`corporateId=${req.headers.userid}&email=${req.body.email}`);
            const encryptedString = cryptr.encrypt(JSON.stringify(encryptPayload));
            let link = `<a href="https://matchupit.com/signup?authorization=${encryptedString}" target="_blank">https://matchupit.com/signup</a>`

            const emailPayload = {
                from: 'no-reply@matchupit.com ',
                to: req.body.email,
                subject: 'matchupIT sign up',
                // html: `<a href="https://matchupit.com/signup?authorization=${encryptedString} target="_blank">https://matchupit.com/signup</a>`
                html: `<p>Dear User,</p>
                <p>You have been invited by ${corpName["name"]} to join matchupit as its member. Kindly click the link given below and proceed to your onboarding.</p>
                <p>${link}</p>`

            }
            respObj.subId = idGenerator('temp');;
            respObj.corporateId = req.headers.userid;
            respObj.is_active = 0;
            respObj.is_master = 0;
            respObj.email = req.body.email;
            await sendMail(emailPayload);
        }
        return responseObj(false, 200, 'Email successfully sent', respObj)
    } catch (ex) {
        console.log(ex);
        return sendResponse({
            err: true,
            responseCode: 500,
            msg: "Error in adding corporate",
            err_stack: ex.stack
        }, res);
    }
};


const removeCorporateMember = async (req, res) => {
    try {

        let reqPayload = Object.keys(req.body);

        if (!reqPayload.includes("is_active")  || !reqPayload.includes("userId") ) {
            return responseObj(
                    true,
                    400,
                    "userId, is_active are mandatory"
            );
        }

        let mappedData = await models.corporatemastermapping.findOne({
            where: {
                subId: req.body.userId,
                is_active: true
            },
            attributes: ["corporateId", "subId"],
            raw: true
        });

        if (mappedData && mappedData["corporateId"] !== req.headers.userid) {
            return responseObj(true, 403, 'You do not have authority to delete the user')
        }

        await models.corporatemastermapping.update({ is_active: req.body.is_active }, { where: { subId: req.body.userId, corporateId: req.headers.userid } });

        let members = await models.corporatemastermapping.findAll({
            where: {
                corporateId: req.headers.userid,
                is_master: {
                    [Op.or]: [0, null]
                },
                is_active: true
            },
            attributes: ["corporateId", "subId", "is_active", "name", "is_master", "email"],
            raw: true
        });

        let message = req.body.is_active ? 'User activated successfully' : 'User deactivated successfully'

        return responseObj(false, 200, message, members)
    } catch (ex) {
        console.log(ex);
        return sendResponse({
            err: true,
            responseCode: 500,
            msg: "Error in removing corporate user",
            err_stack: ex.stack
        },res);
    }
};


async function getProfile(userId, userAccountType, forMap) {
    try {
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
            let valid = await models.corporatemastermapping.findOne({ where: { email: email } })

            if (valid) {
                if (valid.is_active) {
                    isMember = true
                }
            }

            const user = {
                basicDetails: userBasicDetails,
                profile: userProfile,
                profileCompletionPercentage: (forMap) ? undefined : getProfileCompletion(userBasicDetails, userProfile, userAccountType).toFixed(0),
                is_member: isMember
            }
            return responseObj(false, 200, 'Success', user)
        } else if (userAccountType === 'corporate') {
            let masterId = await models.corporatemastermapping.findOne({
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
                profileCompletionPercentage: getProfileCompletion(corporateBasicDetails, corporateProfile, userAccountType).toFixed(0)
            }

            let allSubMembers = await models.corporatemastermapping.findAll({
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


function getProfileCompletion(basicDetails, profile, type) {
    let profileCompletion = 0
    let availableKeyCount = 0
    let allKeyCount = 0
    const basicDetailCompletion = getBasicDetailsCompletion(basicDetails)

    if (type === 'individual') {
        allKeyCount = Object.keys(UserProfile.schema.tree).length - 1 // counting the keys from the model, (ignoring _id and virtual id)
    } else if (type === 'corporate') {
        allKeyCount = Object.keys(CorporateProfile.schema.tree).length - 1 // counting the keys from the model, (ignoring _id and virtual id)
    } else {
        return 0
    }

    if (profile && profile._doc) {
        availableKeyCount = Object.keys(profile._doc).length - 1 // ignoring id
        profileCompletion = Number(availableKeyCount / allKeyCount) * 100
    }
    const totalCompletion = profileCompletion + (basicDetailCompletion / allKeyCount)
    return totalCompletion
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
    return Number((notNullKeysCount / allKeysCount) * 100)
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



async function searchUsers(searchReq, forMap) {
    const searchParams = searchReq.body;
    try {
        const searchText = (searchParams.searchText && searchParams.searchText.split(' ')) || ''
        const pageNo = searchParams.pageNo || 1
        const limit = (forMap) ? 10000 : 10;
        const offset = (forMap) ? 0 : (pageNo - 1) * limit
        let sqlResults = []
        let sqlQuery
        let mongoProjection, mongoQuery
        let queryArray;
        if (searchText) {
            queryArray = [
                {
                    first_name: {
                        [Op.like]: `%${searchText}%`
                    }
                },
                {
                    last_name: {
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
                    state: {
                        [Op.like]: `%${searchText}%`
                    }
                },
                {
                    city: {
                        [Op.like]: `%${searchText}%`
                    }
                },
            ]
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
            mongoQuery = { $text: { $search: searchParams.searchText } }
            mongoProjection = { score: { $meta: 'textScore' }, _id: 1 }
        }
        else {
            sqlQuery = {}
            mongoQuery = {}
            mongoProjection = {}
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
        } else {
            sqlResults = []
        }

        if (!searchParams.name && searchParams.function) {
            mongoQuery['work_experience.jobTitles.0'] = searchParams.function
        }

        if (!searchParams.name && searchParams.role) {
            mongoQuery['work_experience.role.0'] = searchParams.role // filtering based on latest role(jobTitle)
        }

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

            const recent_10 = await models.Searchhistory.findAll({
                where: { userid: searchReq.headers.userid },
                raw: true,
                limit: 10,
                order: [['updatedAt', 'DESC']]
            })

            const recent = recent_10.find(isPresent)

            if (recent) {
                await models.Searchhistory.destroy({ where: { userid: recent.userid, searchtext: recent.searchtext } })
            }
            await models.Searchhistory.create(recentObj)
        }

        // let masterId = await models.corporatemastermapping.findOne({
        //     where: {
        //         subId: searchReq.headers.userid,
        //     },
        //     attributes: ["corporateId", "name"],
        //     raw: true,
        // });

        // if (masterId.corporateId) {
        //     let subIds = await models.corporatemastermapping.findAll({
        //         where: {
        //             corporateId: masterId.corporateId,
        //         },
        //         attributes: ["subId", "name", "corporateId"],
        //         raw: true,
        //     });


        //     let otherCorporates
        //     if (subIds) {
        //         otherCorporates = subIds.filter(x => x.subId !== searchReq.headers.userid);
        //     }


        //     for (let user of userList) {

        //         let myId = await CorporateTags.findOne({ individualId: user.basicDetails.id, corporateId: searchReq.headers.userid });

        //         let comments = [];
        //         if (myId) {
        //             for (let comment of myId.comments) {
        //                 comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: masterId.name, corporateId: myId.corporateId });
        //             }
        //         }

        //         for (let j of otherCorporates) {
        //             let commentData = await CorporateTags.findOne({ individualId: user.basicDetails.id, corporateId: j.subId });
        //             if (commentData) {
        //                 for (let comment of commentData.comments) {
        //                     comments.push({ _id: comment._id, comment: comment.comment, createdOn: comment.createdOn, name: j.name, corporateId: j.corporateId });
        //                 }
        //             }
        //         }
        //         user.taggedDetails = {
        //             comments: comments.sort((x, y) => x.createdOn - y.createdOn),
        //             favourite: myId && myId.favourite,
        //             shortlisted: myId && myId.shortlisted
        //         }
        //     }
        // }

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
            let users = {};


            _.forEach(userList, (user) => {
                let key = user.basicDetails.latitude + "," + user.basicDetails.longitude;
                if (users && users[key] && users[key].commonusers && users[key].commonusers.length && users[key].count) {
                    users[key].commonusers.push({ id: user.basicDetails.id || null, profilePic: user.basicDetails.profile_pic || null, name: user.basicDetails.first_name + " " + user.basicDetails.last_name, experience: (user.profile && user.profile.work_experience && user.profile.work_experience.total_experience) || "NA", city: user.basicDetails.city || null, country: user.basicDetails.country_name || null, address: user.basicDetails.address_line || "NA", zipcode: user.basicDetails.zipcode || null, state: user.basicDetails.state || null });
                    users[key].count++;
                    users[key].lat = user.basicDetails.latitude || "null";
                    users[key].lng = user.basicDetails.longitude || "null";
                } else {

                    users[key] = {
                        count: 1,
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


            Object.keys(users).forEach((key) => {
                arr.push({ lat: users[key].lat, lng: users[key].lng, count: users[key].count, users: users[key].commonusers })
            })

            userList = arr
            return responseObj(false, 200, 'Users successfully found', { userList: userList, totalCount: userCount || 0, invisible: invisible.length || 0, zoomTo: zoomTo || null, position: position || null })

        }
        return responseObj(false, 200, 'Users successfully found', { userList: userList })
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in searching users', { err_stack: ex.stack })
    }
}


async function getUserProfile(userId, userAccountType, forMap) {
    try {
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
            let valid = await models.corporatemastermapping.findOne({ where: { email: email } })

            if (valid) {
                if (valid.is_active) {
                    isMember = true
                }
            }

            const user = {
                basicDetails: userBasicDetails,
                profile: userProfile,
                profileCompletionPercentage: (forMap) ? undefined : getProfileCompletion(userBasicDetails, userProfile, userAccountType).toFixed(0),
                is_member: isMember
            }
            return responseObj(false, 200, 'Success', user)
        } else if (userAccountType === 'corporate') {
            let masterId = await models.corporatemastermapping.findOne({
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
                profileCompletionPercentage: getProfileCompletion(corporateBasicDetails, corporateProfile, userAccountType).toFixed(0)
            }

            let allSubMembers = await models.corporatemastermapping.findAll({
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





const getTaggedUsers = async (req, res) => {


    try {

        let favouriteUsers = await CorporateTags.find({
            favourite: true,
            corporateId: req.headers.userid
        }, { individualId: 1, comments: 1 });
        let favouriteUsersList = [], shortListedUsersList = [], taggedUsersList = [];

        for (let user of favouriteUsers) {
            let userObj = await User.findOne({ where: { id: user.individualId }, attributes: ["id", "email", "first_name", "last_name", "profile_pic"], raw: true });
            // userObj.comments = user.comments
            favouriteUsersList.push(userObj);
        }



        let shortListedUsers = await CorporateTags.find({
            shortlisted: true,
            corporateId: req.headers.userid
        }, { individualId: 1 });

        for (let user of shortListedUsers) {
            let userObj = await User.findOne({ where: { id: user.individualId }, attributes: ["id", "email", "first_name", "last_name", "profile_pic"], raw: true });
            shortListedUsersList.push(userObj);
        }


        let taggedUsers = await CorporateTags.find({
            'comments.0': { "$exists": true },
            corporateId: req.headers.userid
        }, { individualId: 1, comments: 1 });

        for(let user of taggedUsers) {
            let userObj = await User.findOne({ where: { id: user.individualId }, attributes: ["id", "email", "first_name", "last_name", "profile_pic"], raw: true });
            userObj.comments = user.comments
            taggedUsersList.push(userObj);
        }

        return responseObj(false, 200, 'Success', { favouriteUsersList, shortListedUsersList, taggedUsersList })



    }
    catch (ex) {
        console.log(ex);
        return sendResponse(
            {
                err: true,
                responseCode: 500,
                msg: "error in tagging tagged users",
                err_stack: ex.stack
            }
        );
    }
}

module.exports = {
    searchCorporate,
    trackProfileVisit,
    getRecentSearch: getRecentSearch,
    getPopularProfile: getPopularProfile,
    getRecentProfile: getRecentProfile,
    getPopularText: getPopularText,
    tagUser,
    addCorporateMember,
    removeCorporateMember,
    getCorporateProfile,
    getTaggedUsers
}