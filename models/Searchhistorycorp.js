'use strict';
module.exports = (sequelize, DataTypes) => {
  const Searchhistorycorp = sequelize.define('Searchhistorycorp', {
    userid: DataTypes.STRING,
    searchtext: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,
    emp_count: DataTypes.STRING,
    type: DataTypes.STRING,
    zipcode: DataTypes.STRING,
    industry: DataTypes.STRING,
    name: DataTypes.BOOLEAN
  }, {});
  Searchhistorycorp.associate = function(models) {
    // associations can be defined here
  };
  return Searchhistorycorp;
};