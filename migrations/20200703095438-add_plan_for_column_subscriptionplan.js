'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        'subscriptionplans',
        'plan_for',
        {
          type: Sequelize.CHAR
        }
      )
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('subscriptionplans', 'plan_for')
    ]);
  }
};
