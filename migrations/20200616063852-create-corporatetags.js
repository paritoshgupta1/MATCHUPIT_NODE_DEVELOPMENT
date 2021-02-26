'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('corporatetags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      corporateId: {
        type: Sequelize.STRING
      },
      individualId: {
        type: Sequelize.STRING
      },
      comments: {
        type: Sequelize.STRING(255)
      },
      createdOn: {
        type: Sequelize.DATE
      },
      shortlisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      favourite: {
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
    return queryInterface.dropTable('corporatetags');
  }
};