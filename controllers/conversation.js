const {
    Op
} = require("sequelize");
const sendResponse = require("../helpers/response_handler").sendResponse;
const _get = require("lodash").get;
const _ = require("lodash");
const User = require("../models/user");
const Chat = require('../models/schemas/chat');
const Conversation = require("../models/schemas/conversation");
const UserProfile = require('../models/schemas/user_profiles');
const Corporate = require('../models/corporate')
const userService = require('../services/user')
const sendMail = require('../helpers/email/email').sendMail

const createConversation = async (req, res) => {

    const {
        senderId,
        senderName,
        senderImage,
        receiverId,
        receiverName,
        receiverImage
    } = req.body;

    if (!senderId || !senderName || !receiverId || !receiverName) {
        sendResponse({
            err: true,
            responseCode: 400,
            msg: 'Incorrect input'
        }, res)
    }

    let conversationExists = await Conversation.findOne({"sender.userId": senderId, "receiver.userId":receiverId})

    if (conversationExists) {
        return sendResponse({
            err: false,
            responseCode: 200,
            msg: "Conversation already Exists",
            conversationExists: true,
            conversation: conversationExists
        },
            res
        );

    }


    let conversationObj = {
        sender: {
            userId: senderId,
            username: senderName,
            profile_pic: senderImage,
        },
        receiver: {
            userId: receiverId,
            username: receiverName,
            profile_pic: receiverImage,
        }
    }

    let conversation = new Conversation(conversationObj);

    await conversation.save();

    return sendResponse({
        err: false,
        responseCode: 200,
        conversationExists: false,
        msg: "Conversation created",
        conversation: conversation
    },
        res
    );


};



const getConversations = async (req, res) => {

    let conversationExists = await Conversation.find({ $or: [{ "sender.userId": req.headers.userid }, { "receiver.userId": req.headers.userid }] })

    if (conversationExists) {

        let conversations  = JSON.parse(JSON.stringify(conversationExists));
        let hasMessages = [];

        for (let conversation of conversations) {
            let message = await Chat.findOne({ conversationId: conversation._id }).sort({ "message.createdOn": -1 }).limit(1);
            if (message) {
                if (conversation.receiver.userId.startsWith("c")) {
                    let corporateData = await Corporate.findOne({
                        where: {
                          id: conversation.receiver.userId
                        },
                        attributes: ["id", "name", "type", "employee_count"],
                    });
                    conversation.receiver.subname = `${corporateData["type"]} Organisation, ${corporateData["employee_count"]} Employees`;
                } else {
                    const receiverData = await UserProfile.findById(conversation.receiver.userId, { "work_experience.designations": 1 })
                    if(receiverData){
                        const receiverDesignation = receiverData.work_experience && receiverData.work_experience.designations && receiverData.work_experience.designations[0];
                        if (receiverDesignation) {
                            conversation.receiver.subname = receiverDesignation;
                        }
                        else {
                            conversation.receiver.subname = "No designation found";
                        }
                    }
                    else {
                        conversation.receiver.subname = "No designation found";
                    }
                }
                if (conversation.sender.userId.startsWith("c")) {
                    let corporateData = await Corporate.findOne({
                        where: {
                          id: conversation.sender.userId
                        },
                        attributes: ["id", "name", "type", "employee_count"],
                    });
                    conversation.sender.subname = `${corporateData["type"]} Organisation, ${corporateData["employee_count"]} Employees`;
                } else {
                    const senderData = await UserProfile.findById(conversation.sender.userId, { "work_experience.designations": 1 })
                    if(senderData){
                        const senderDesignation = senderData.work_experience && senderData.work_experience.designations && senderData.work_experience.designations[0];
                        if (senderDesignation) {
                            conversation.sender.subname = senderDesignation;
                        } else {
                            conversation.sender.subname = "No designation found";
                        }
                    }
                    else {
                        conversation.sender.subname = "No designation found";
                        
                    }
                }
                conversation.message = message;
                hasMessages.push(conversation);
            }
        }

        let ordered = hasMessages.sort((a, b)=> {
            let c = new Date(a.message.message.createdOn);
            let d = new Date(b.message.message.createdOn);
            return d-c;
        });

        return sendResponse({
            err: false,
            responseCode: 200,
            conversations: ordered  
        },
            res
        );
    }

};

const addMessage = async (req, res) => {

    const { conversationId } = req.body;
    const { text, owner, attachments, messageType, timeStamp } = req.body.message;

    let conversationExists = await Conversation.findById(conversationId)
    //let conversationExists11 = await Conversation.find({ $or: [{ "receiver.userId": req.headers.userid }] })
    let conversationExists11 = await Conversation.find({ $or: [{ "sender.userId": req.headers.userid }, { "receiver.userId": req.headers.userid }] })
    if (conversationExists11) {

        let conversations11  = JSON.parse(JSON.stringify(conversationExists11));
        for (let conversation1 of conversations11) {
        let recieverUserId = conversation1.receiver.userId;
        let senderUserId = conversation1.sender.userId;
        let recieverName = conversation1.receiver.username
        let senderName = conversation1.sender.username
        let userData = await User.findOne({
            where: {
                id: senderUserId
            },
            attributes: ["first_name","last_name","email"],
            raw: true
        })

    if(userData){
    let recieverEmailId = userData.email
    if(recieverEmailId != 'lalitdhingra.home@gmail.com'){
    //recieverEmailId = 'rajan.bhardwaj@ensignis-digital.com'
    const emailPayload = {
        from: 'no-reply@matchupit.com ',
        to: recieverEmailId,
        subject: 'Uread Message in matchupIT Messanger',
        html: `<p>Dear User,</p>
    <p>You have one pending message from ${recieverName} in MatchupIT.</p>`
    }
    await sendMail(emailPayload);
}
    }
       }
    }

    if (conversationExists) {

        let chatObj = {
            conversationId,
            message: {
                createdOn: new Date(),
                timeStamp,
                text,
                owner,
                attachments,
                messageType
            }
        }

        let chat = new Chat(chatObj);

        let result = await chat.save();

        return sendResponse({
            err: false,
            responseCode: 200,
            msg: result
        },
            res
        );
    }
    else {
        return sendResponse({
            err: true,
            responseCode: 400,
            msg: 'No conversation exists with the given Id'
        },
            res
        );

    }

};


const getMessages = async (req, res) => {

    const { conversationId, page, limit } = req.query;
    const limit1 = limit ? limit : 10;
    const page1 = Number(page) || 1;
    const offset = (page1 - 1) * limit1;

    let messages = await Chat.find({ conversationId }).limit(Number(limit1)).skip(offset).sort({ "message.createdOn": -1 });
    let reverse = _.sortBy(messages, ["message.createdOn"], ["desc"]);
    let groupedData = groupData(JSON.parse(JSON.stringify(reverse)));


    if (messages) {

        return sendResponse({
            err: false,
            responseCode: 200,
            msg: groupedData
        },
            res
        );
    }
    else {
        return sendResponse({
            err: false,
            responseCode: 200,
            msg: 'No messages with given conversation Id'
        },
            res
        );

    }

};

const groupData = (array)=>  {
    let finalObj = {};
    array.forEach((data) => {
    const date = data.message.createdOn.split("T")[0];
    if (finalObj[date]) {
      finalObj[date].push(data);
    } else {
      finalObj[date] = [data];
    }
  });
  return finalObj;
}


module.exports = {
    createConversation,
    getConversations,
    addMessage,
    getMessages
};