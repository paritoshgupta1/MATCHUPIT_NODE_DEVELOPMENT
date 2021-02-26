'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('jobtypes', {
      Id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Name: {
        type: Sequelize.STRING
      },
      Code: {
        type: Sequelize.STRING
      },
      Description: {
        type: Sequelize.STRING
      },
      CompensationPeriod: {
        type: Sequelize.STRING
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
    return queryInterface.dropTable('jobtypes');
  }
};