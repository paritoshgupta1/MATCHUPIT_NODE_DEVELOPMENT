'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('corporates', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      account_type: {
        type: Sequelize.STRING,
        defaultValue: 'corporate'
      },
      type: {
        type: Sequelize.STRING
      },
      industry: {
        type: Sequelize.STRING
      },
      employee_count: {
        type: Sequelize.STRING
      },
      revenue: {
        type: Sequelize.INTEGER
      },
      revenue_currency: {
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
      telephone: {
        type: Sequelize.STRING
      },
      dial_code: {
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
      latitude: {
        type: Sequelize.STRING
      },
      longitude: {
        type: Sequelize.STRING
      },
      city: {
        type: Sequelize.STRING
      },
      establishment_date: {
        type: Sequelize.STRING
      },
      logo: {
        type: Sequelize.STRING(300)
      },
      video_intro: {
        type: Sequelize.STRING(300)
      },
      culture: {
        type: Sequelize.STRING(1000)
      },
      website: {
        type: Sequelize.STRING(300)
      },
      current_road_map: {
        type: Sequelize.STRING(1000)
      },
      future_road_map: {
        type: Sequelize.STRING(1000)
      },
      expiry_date: {
        type: Sequelize.DATE
      },
      ticker: {
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
    return queryInterface.dropTable('corporates');
  }
};