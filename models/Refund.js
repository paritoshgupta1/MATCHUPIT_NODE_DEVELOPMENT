'use strict';
module.exports = (sequelize, DataTypes) => {
  const refund = sequelize.define('refund', {
    refund_value: DataTypes.INTEGER,
    refund_date: DataTypes.DATE,
    reason: DataTypes.STRING,
    initiated_by: DataTypes.STRING,
    refund_status: DataTypes.BOOLEAN
  }, {});
  refund.associate = function(models) {
    // associations can be defined here
  };
  return refund;
};