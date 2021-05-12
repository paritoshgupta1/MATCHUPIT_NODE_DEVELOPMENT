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

const getUnreadMessages = async (req, res) => {
    let unreadMessages =  0;
    let conversation1 = 0;
    let conversationExists = await Conversation.find({ $or: [{ "sender.userId": req.headers.userid }, { "receiver.userId": req.headers.userid }] })
    let getOwner = req.headers.userid
    if (conversationExists) {
        var arr = [];
        let conversations  = JSON.parse(JSON.stringify(conversationExists));
        
        for (let conversation of conversations) {
            
            let readmessage = await Chat.count({ conversationId: conversation._id, recieverUserId: getOwner, rstatus: "nread" })
            unreadMessages += readmessage;
            if(readmessage >0){
                var obj = new Object();
                obj.conversation1 = conversation._id;
                obj.unreadMessages = readmessage
                arr.push(obj);
        }
            
        }
        var obj1 = new Object();
        obj1.totalUnreadMessages = unreadMessages;
        arr.push(obj1);
    }

    if (unreadMessages === 0) {
        var obj1 = new Object();
        obj1.totalUnreadMessages = unreadMessages;
        arr.push(obj1);
    }

    if (unreadMessages > 0) {

        return sendResponse({
            err: false,
            responseCode: 200,
            arr
        },
            res
        );
    }
    else {
        return sendResponse({
            err: false,
            responseCode: 200,
            arr
        },
            res
        );

    }
}

const getConversations = async (req, res) => {

    let conversationExists = await Conversation.find({ $or: [{ "sender.userId": req.headers.userid }, { "receiver.userId": req.headers.userid }] })

    if (conversationExists) {

        let conversations  = JSON.parse(JSON.stringify(conversationExists));
        let hasMessages = [];

        for (let conversation of conversations) {
            let message = await Chat.findOne({ conversationId: conversation._id }).sort({ "message.timeStamp": -1 }).limit(1);
            
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
            let c = new Date(a.message.message.timeStamp);
            let d = new Date(b.message.message.timeStamp);
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
    const { text, reciever, owner, sender, attachments, messageType, timeStamp } = req.body.message;

    let conversationExists = await Conversation.findById(conversationId)
    let recieverUserId = null
    if(owner === sender.userId)
        {
         recieverUserId = reciever.userId;
        }
        else if(owner === reciever.userId)
        {
            recieverUserId = sender.userId;
        }
 
    if (conversationExists) {

        let chatObj = {
            rstatus: "nread",
            recieverUserId,
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
        
        
        let corporateData
        if (owner.startsWith("c")) {
            recieverUserId = sender.userId;
            corporateData = await Corporate.findOne({
                where: {
                  id: owner
                },
                attributes: ["name", "is_login"]
            });
        } 
        if(recieverUserId != null){
        let userData = await User.findOne({
            where: {
                id: recieverUserId
            },
            attributes: ["first_name","last_name","email", "is_login"],
            raw: true
        })

    if(userData){
       
    let recieverEmailId = userData.email
    let senderName
    if (owner.startsWith("c")) {
        senderName = corporateData.name
    }else {
    if(owner === reciever.userId)
        {
            senderName = reciever.username;
        }
        else if(owner === sender.userId)
        {
            senderName = sender.username;
        }
    }
    if(userData.is_login === 1){
        const emailPayload = {
            from: 'no-reply@matchupit.com ',
            to: recieverEmailId,
            subject: 'Unread Message in matchupIT Messanger',
            html: `<p>Dear User,</p>
        <p>You have pending message from ${senderName} in MatchupIT.</p>`
        }
            await sendMail(emailPayload);
        }
    }  
}
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

    let messages = await Chat.find({ conversationId }).limit(Number(limit1)).skip(offset).sort({ "message.timeStamp": -1 });
    let reverse = _.sortBy(messages, ["message.timeStamp"], ["desc"]);
    //let countmessages = _.countBy(messages, "rstatus");
    let getOwner = req.headers.userid
    let groupedData = groupData(JSON.parse(JSON.stringify(reverse)));
    await Chat.updateMany({ conversationId :conversationId, recieverUserId: getOwner,rstatus: "nread" },{
        $set: { rstatus: "read" }
    })


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
    const date = data.message.timeStamp.split("T")[0];
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
    getMessages,
    getUnreadMessages
};