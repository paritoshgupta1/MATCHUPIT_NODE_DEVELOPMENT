'use strict';
module.exports = (sequelize, DataTypes) => {
  const orderhistory = sequelize.define('orderhistory', {
    order_id: DataTypes.INTEGER,
    order_status_id: DataTypes.INTEGER,
    comments: DataTypes.STRING
  }, {});
  orderhistory.associate = function(models) {
    // associations can be defined here
  };
  return orderhistory;
};