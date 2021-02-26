'use strict';
module.exports = (sequelize, DataTypes) => {
  const subscription = sequelize.define('subscription', {
    order_id: DataTypes.INTEGER,
    user_id: DataTypes.STRING,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    is_disabled: DataTypes.BOOLEAN,
    subscription_code: DataTypes.STRING,
    subscription_plan_type: DataTypes.INTEGER
  }, {});
  subscription.associate = function(models) {
    // associations can be defined here
  };
  return subscription;
};