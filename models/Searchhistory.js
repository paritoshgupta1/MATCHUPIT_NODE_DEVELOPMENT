'use strict';
module.exports = (sequelize, DataTypes) => {
  const Searchhistory = sequelize.define('Searchhistory', {
    userid: DataTypes.STRING,
    searchtext: DataTypes.STRING,
    function: DataTypes.STRING,
    zipcode: DataTypes.STRING,
    role: DataTypes.STRING,
    skills: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,
    experience: DataTypes.STRING,
    name: DataTypes.BOOLEAN
  }, {});
  Searchhistory.associate = function(models) {
    // associations can be defined here
  };
  return Searchhistory;
};