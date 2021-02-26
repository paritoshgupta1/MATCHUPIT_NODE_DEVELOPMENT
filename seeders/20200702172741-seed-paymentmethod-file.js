'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('paymentmethods', [
      {
        name: 'stripe',
        description: "Stripe",
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'paypal',
        description: "Paypal",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

    ], {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('orderstatuses', [{
      name: 'stripe'
    },
    {
      name: 'paypal'
    }])
  }
};
