'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      title: {
        type: Sequelize.STRING
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      email_verified: {
        type: Sequelize.BOOLEAN
      },
      payment_status: {
        type: Sequelize.BOOLEAN
      },
      recovery_email: {
        type: Sequelize.STRING
      },
      recovery_email_verified: {
        type: Sequelize.BOOLEAN
      },
      password: {
        type: Sequelize.STRING
      },
      phone: {
        type: Sequelize.STRING
      },
      dial_code: {
        type: Sequelize.STRING
      },
      phone_verified: {
        type: Sequelize.STRING
      },
      country_name: {
        type: Sequelize.STRING
      },
      zipcode: {
        type: Sequelize.STRING
      },
      address_line: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      citizenship: {
        type: Sequelize.STRING
      },
      dob: {
        type: Sequelize.STRING
      },
      gender: {
        type: Sequelize.STRING
      },
      latitude: {
        type: Sequelize.STRING
      },
      longitude: {
        type: Sequelize.STRING
      },
      profile_pic: {
        type: Sequelize.STRING(300)
      },
      other_country_authorization: {
        type: Sequelize.STRING
      },
      account_type: {
        type: Sequelize.STRING
      },
      available_hire: {
        type: Sequelize.BOOLEAN
      },
      expiry_date: {
        type: Sequelize.DATE
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
    return queryInterface.dropTable('users');
  }
};