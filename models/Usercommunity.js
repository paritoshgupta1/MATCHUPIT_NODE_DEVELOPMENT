'use strict';
module.exports = (sequelize, DataTypes) => {
  const usercommunity = sequelize.define('usercommunity', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: DataTypes.STRING,
    communityId: DataTypes.STRING
  }, {});
  usercommunity.associate = function(models) {
    // associations can be defined here
  };
  return usercommunity;
};


