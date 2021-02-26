'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('refunds', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      refund_value: {
        type: Sequelize.INTEGER
      },
      refund_date: {
        type: Sequelize.DATE
      },
      reason: {
        type: Sequelize.STRING
      },
      initiated_by: {
        type: Sequelize.STRING
      },
      refund_status: {
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
    return queryInterface.dropTable('refunds');
  }
};