'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProfileVisits = sequelize.define('ProfileVisits', {
    userid: DataTypes.STRING,
    individualId: DataTypes.STRING
  }, {});
  ProfileVisits.associate = function(models) {
    // associations can be defined here
  };
  return ProfileVisits;
};