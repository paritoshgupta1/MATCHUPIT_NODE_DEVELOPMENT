'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_number: {
        type: Sequelize.STRING
      },
      payment_gateway_transaction_id: {
        type: Sequelize.STRING
      },
      customer_id: {
        type: Sequelize.STRING
      },
      order_status_id: {
        type: Sequelize.INTEGER
      },
      payment_method: {
        type: Sequelize.INTEGER
      },
      customer_currency: {
        type: Sequelize.STRING
      },
      order_tax: {
        type: Sequelize.FLOAT
      },
      order_discount: {
        type: Sequelize.FLOAT
      },
      order_total: {
        type: Sequelize.FLOAT
      },
      refund_id: {
        type: Sequelize.INTEGER
      },
      comments: {
        type: Sequelize.STRING
      },
      ip_address: {
        type: Sequelize.STRING
      },
      session_id: {
        type: Sequelize.STRING
      },
      invalid: {
        type: Sequelize.BOOLEAN
      },
      payment_response_id: {
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
    return queryInterface.dropTable('orders');
  }
};