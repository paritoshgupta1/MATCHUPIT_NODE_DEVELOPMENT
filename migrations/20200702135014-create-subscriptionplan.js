'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('subscriptionplans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      plan_name: {
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.FLOAT
      },
      period_in_months: {
        type: Sequelize.INTEGER
      },
      currency_code: {
        type: Sequelize.STRING
      },
      is_disabled: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('subscriptionplans');
  }
};