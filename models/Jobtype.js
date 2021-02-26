'use strict';
module.exports = (sequelize, DataTypes) => {
  const jobtype = sequelize.define('jobtype', {
    Name: DataTypes.STRING,
    Code: DataTypes.STRING,
    Description: DataTypes.STRING,
    CompensationPeriod: DataTypes.STRING,
    Active: DataTypes.BOOLEAN,
    Deleted: DataTypes.BOOLEAN
  }, {});
  jobtype.associate = function(models) {
    // associations can be defined here
  };
  return jobtype;
};