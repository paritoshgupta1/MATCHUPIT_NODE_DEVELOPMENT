const Countries = require('../models/schemas/countires')
const Currencies = require('../models/schemas/currencies')
const responseObj = require('../helpers/response_handler').responseObj
const _ = require('lodash')


async function getCountries() {
  try {
    const countryResult = await Countries.find().sort({ CountryList: 'asc' });
    const currencyResult = await Currencies.find();
    let sortedCurrency = _.sortBy(currencyResult[0].CurrencyList, 'name');

    return responseObj(false, 200, 'Success', { countryResult: countryResult[0].CountryList.sort(), currencyResult: sortedCurrency })
  } catch (ex) {
    console.log(ex)
    return responseObj(true, 500, 'Error in getting questionnaire',{err_stack: ex.stack})
  }
}

module.exports = {
  getCountries: getCountries
}
