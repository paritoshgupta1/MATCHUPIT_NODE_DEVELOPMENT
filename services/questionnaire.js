const Questionnaire = require('../models/schemas/questionnaire')
const UserProfile = require('../models/schemas/user_profiles')
const User = require('../models/user')
const idGenerator = require('../helpers/id_generator').generateId
const responseObj = require('../helpers/response_handler').responseObj
const _ = require('lodash')
async function addQuestionnaire (questionnairePayload) {
  try {
    questionnairePayload = _.map(questionnairePayload, (question) => {
      question._id = idGenerator('q')
      return question
    })
    await Questionnaire.insertMany(questionnairePayload)
    return responseObj(false, 200, 'Questionnaire has been added')
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in adding questionnaire',{err_stack: ex.stack})
  }
}

async function getQuestionnaire (userid) {
  try {
    let user = await User.findOne({ where: { id: userid } })
    if (!user) {
      return responseObj(true, 400, 'User not found')
    }
    user = user.dataValues
    const userProfile = await UserProfile.findById(userid)
    const questionnaireResult = await Questionnaire.find().sort({ sequence_no: 'asc' })
    for (let i = 0; i < questionnaireResult.length; i++) {
      const question = questionnaireResult[i]
      if (question.name === 'fullName') question.isAnswered = (user.first_name == null) ? 0 : 1
      else if (question.name === 'phoneNo') question.isAnswered = (user.phone == null) ? 0 : 1
      else if (question.name === 'emailId') question.isAnswered = (user.recovery_email == null) ? 0 : 1
      else if (question.name === 'location') question.isAnswered = (user.country_name !== null && user.state !== null && user.zipcode !== null && user.address_line !== null) ? 1 : 0
      else if (question.name === 'locationCountry') question.isAnswered = (user.country_name == null) ? 0 : 1
      else if (question.name === 'locationState') question.isAnswered = (user.state == null) ? 0 : 1
      else if (question.name === 'locationCity') question.isAnswered = (user.city == null) ? 0 : 1
      else if (question.name === 'locationZip') question.isAnswered = (user.zipcode == null) ? 0 : 1
      else if (question.name === 'locationAddress') question.isAnswered = (user.address_line == null) ? 0 : 1
      else if (question.name === 'dateOfBirth') question.isAnswered = (user.dob == null) ? 0 : 1
      else if (question.name === 'citizenship') question.isAnswered = (user.citizenship == null) ? 0 : 1
      else if (question.name === 'workAuth') {
        question.isAnswered = (user.other_country_authorization == null) ? 0 : 1
        // skip next 3 questions/
        if (question.isAnswered) {
          for (let k = i + 1; k <= i + 3; k++) {
            questionnaireResult[k].isAnswered = 1
          }
          i = i + 3
        }
      } else if (question.name === 'workExperience') {
        question.isAnswered = (userProfile.work_experience && Object.keys(userProfile.work_experience).length > 0) ? 1 : 0
        // skip next 10 questions/
        if (question.isAnswered) {
          for (let k = i + 1; k <= i + 10; k++) {
            questionnaireResult[k].isAnswered = 1
          }
          i = i + 10
        }
      } else if (question.name === 'decision2') {
        question.isAnswered = (userProfile.work_experience && userProfile.work_experience.currentlyWorking) ? 1 : 0
      }
       else if (question.name === 'certification') {
        question.isAnswered = (userProfile.certifications && Object.keys(userProfile.certifications).length > 0) ? 1 : 0
        // skip next 5 questions/
        if (question.isAnswered) {
          for (let k = i + 1; k <= i + 5; k++) {
            questionnaireResult[k].isAnswered = 1
          }
          i = i + 5
        }
      } else if (question.name === 'education') {
        question.isAnswered = (userProfile.education && Object.keys(userProfile.education).length > 0) ? 1 : 0
        // skip next 8 questions/
        if (question.isAnswered) {
          for (let k = i + 1; k <= i + 8; k++) {
            questionnaireResult[k].isAnswered = 1
          }
          i = i + 8
        }
      }
      else if (question.name === 'aboutMe') {
        question.isAnswered = (userProfile.personal_details && userProfile.personal_details.aboutMe) ? 1 : 0
      }
      else if (question.name === 'decision1') {
        question.isAnswered = (userProfile.education && userProfile.education.degree.length > 0) ? 1 : 0
      } else if (question.name === 'imageCapture') question.isAnswered = (_.get(userProfile, 'media.headshot')) ? 1 : 0
       else if (question.name === 'decision3') question.isAnswered = (_.get(userProfile, 'media.headshot')) ? 1 : 0
      else if (question.name === 'videoCapture') question.isAnswered = (_.get(userProfile, 'media.videoshot')) ? 1 : 0
    }
    return responseObj(false, 200, 'Success', questionnaireResult)
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in getting questionnaire',{err_stack: ex.stack})
  }
}

module.exports = {
  addQuestionnaire: addQuestionnaire,
  getQuestionnaire: getQuestionnaire
}
