'use strict';
module.exports = (sequelize, DataTypes) => {
  const userjobtypemapping = sequelize.define('userjobtypemapping', {
    UserId: DataTypes.STRING,
    JobTypeId: DataTypes.INTEGER,
    CompensationCurrency: DataTypes.STRING,
    CompensationValue: DataTypes.DECIMAL,
    Active: DataTypes.BOOLEAN,
    Deleted: DataTypes.BOOLEAN
  }, {});
  userjobtypemapping.associate = function(models) {
    // associations can be defined here
    userjobtypemapping.belongsTo(sequelize.define("jobtype"), { foreignKey: 'JobTypeId' })
  };
  return userjobtypemapping;
};