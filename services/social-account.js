const UserModel = require('../models/user')
const UserProfileSchema = require('../models/schemas/user_profiles')
const generateId = require('../helpers/id_generator').generateId
const responseObj = require('../helpers/response_handler').responseObj
const generateJWT = require('../helpers/jwt').generateJWT

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
    }
      const userObj = {}
      userObj.email = userRec.email
      userObj.id = userRec.id
      userObj.email_verified = userRec.email_verified
      userObj.account_type = userRec.account_type
      userObj.token = generateJWT(userObj)
      return responseObj(false, 200, 'Success', userObj)
    } catch (ex) {
        console.log(ex)
        return responseObj(true, 500, 'Error in social handling',{err_stack: ex.stack})
      }
}
module.exports = {
  socialAccountHandler: socialAccountHandler
}
