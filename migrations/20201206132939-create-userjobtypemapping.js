'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('userjobtypemappings', {
      Id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      UserId: {
        type: Sequelize.STRING
      },
      JobTypeId: {
        type: Sequelize.INTEGER
      },
      CompensationCurrency: {
        type: Sequelize.STRING
      },
      CompensationValue: {
        type: Sequelize.DECIMAL(19,5)
      },
      Active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      Deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    return queryInterface.dropTable('userjobtypemappings');
  }
};