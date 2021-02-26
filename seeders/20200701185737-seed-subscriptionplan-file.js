'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('subscriptionplans', [{
      plan_name : 'Individual Monthly',
      amount : 4.99,
      period_in_months : 30,
      is_disabled: false,
      currency_code: "usd",
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      plan_name : 'Individual Yearly',
      amount : 59.00,
      period_in_months : 365,
      is_disabled: false,
      currency_code: "usd",
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      plan_name : 'Corporate Monthly',
      amount : 99.99,
      period_in_months : 30,
      is_disabled: false,
      currency_code: "usd",
      createdAt : new Date(),
      updatedAt : new Date()
    },
    {
      plan_name : 'Corporate Yearly',
      amount : 1199.00,
      period_in_months : 365,
      is_disabled: false,
      currency_code: "usd",
      createdAt : new Date(),
      updatedAt : new Date()
    }], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('subscriptionplans', [{
      plan_name :'Individual Monthly'
    },
    {
      plan_name :'Individual Yearly'
    },
    {
      plan_name :'Corporate Monthly'
    },
    {
      plan_name :'CCorporate yearly'
    }])
  }
};
