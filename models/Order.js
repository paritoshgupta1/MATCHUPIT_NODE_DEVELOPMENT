'use strict';
module.exports = (sequelize, DataTypes) => {
  const order = sequelize.define('order', {
    order_number: DataTypes.STRING,
    payment_gateway_transaction_id: DataTypes.STRING,
    customer_id: DataTypes.STRING,
    order_status_id: DataTypes.INTEGER,
    payment_method: DataTypes.INTEGER,
    customer_currency: DataTypes.STRING,
    order_tax: DataTypes.FLOAT,
    order_discount: DataTypes.FLOAT,
    order_total: DataTypes.FLOAT,
    refund_id: DataTypes.INTEGER,
    comments: DataTypes.STRING,
    ip_address: DataTypes.STRING,
    session_id: DataTypes.STRING,
    invalid: DataTypes.BOOLEAN,
    payment_response_id: DataTypes.STRING
  }, {});
  order.associate = function(models) {
    // associations can be defined here
    order.hasOne(sequelize.define("subscription"), { foreignKey: 'order_id' })
  };
  return order;
};