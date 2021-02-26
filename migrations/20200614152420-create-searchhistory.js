'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Searchhistories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userid: {
        type: Sequelize.STRING
      },
      searchtext: {
        type: Sequelize.STRING
      },
      zipcode: {
        type: Sequelize.STRING
      },
      region: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING
      },
      sal_range: {
        type: Sequelize.STRING
      },
      experience: {
        type: Sequelize.STRING
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
    return queryInterface.dropTable('Searchhistories');
  }
};