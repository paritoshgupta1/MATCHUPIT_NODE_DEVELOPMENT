'use strict';
module.exports = (sequelize, DataTypes) => {
  const subscriptionplan = sequelize.define('subscriptionplan', {
    plan_name: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    period_in_months: DataTypes.INTEGER,
    currency_code: DataTypes.STRING,
    is_disabled: DataTypes.BOOLEAN,
    plan_for: DataTypes.CHAR
  }, {});
  subscriptionplan.associate = function(models) {
    // associations can be defined here
  };
  return subscriptionplan;
};