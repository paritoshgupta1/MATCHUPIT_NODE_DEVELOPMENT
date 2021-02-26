'use strict';
module.exports = (sequelize, DataTypes) => {
  const ProfileVisitscorp = sequelize.define('ProfileVisitscorp', {
    userId: DataTypes.STRING,
    corpId: DataTypes.STRING
  }, {});
  ProfileVisitscorp.associate = function(models) {
    // associations can be defined here
  };
  return ProfileVisitscorp;
};