const Industries = require('../models/schemas/industries')
const Roles = require('../models/schemas/roles')
const Skills = require('../models/schemas/skills')

const responseObj = require('../helpers/response_handler').responseObj
const _ = require('lodash')

async function getIndustryInfo () {
  try {
    const industryResult = await Industries.find()
    const RolesResult = await Roles.find()
    const SkillsResult = await Skills.find()

    // let roles = _.sortBy(RolesResult[0].roles, ["function"]);
    // let sortedRoles = roles.map(obj => ({
    //   ...obj, role: obj.role.sort()
    // }))


    let roles = RolesResult[0].functions;

    roles = _.sortBy(roles, ["name"]);

    // let sortedRoles = roles.map(obj => ({
    //   ...obj, role: obj.role.sort()
    // }))

    for (let i of roles) {
      i.roles = _.sortBy(i.roles, 'name');
    }

    // console.log('dnfdjsfldsjfds', roles)

    // let roleArray = []
    // for (let i of roles) {
    //   let obj = {}
    //   obj.role = []
    //   obj.function = i.name
    //   for (j of i.roles) {
    //     obj.role.push(j.name)
    //   }
    //   roleArray.push(obj)
    // }

    // let roles1 = _.sortBy(roleArray, ["function"]);
    // let sortedRoles = roles1.map(obj => ({
    //   ...obj, role: obj.role.sort()
    // }))



    return responseObj(false, 200, 'Success', {
      industries: industryResult[0].industries.sort(),
      // roles: sortedRoles[0].__parentArray
      functions: roles,
      skills: SkillsResult[0].skills.sort()
    })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in getting industry info',{err_stack: ex.stack})
  }
}

module.exports = {
  getIndustryInfo: getIndustryInfo
}
