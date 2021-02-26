'use strict';
module.exports = (sequelize, DataTypes) => {
  const paymentmethod = sequelize.define('paymentmethod', {
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {});
  paymentmethod.associate = function(models) {
    // associations can be defined here
  };
  return paymentmethod;
};