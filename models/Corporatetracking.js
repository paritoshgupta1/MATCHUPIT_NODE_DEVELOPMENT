'use strict';
module.exports = (sequelize, DataTypes) => {
  const corporatetracking = sequelize.define('corporatetracking', {
    
    trackingdate: DataTypes.STRING,
    login: DataTypes.INTEGER,
    search: DataTypes.INTEGER,
    messenger: DataTypes.INTEGER,
    community: DataTypes.INTEGER,
    news: DataTypes.INTEGER
  }, {});
  corporatetracking.associate = function(models) {
    // associations can be defined here
  };
  return corporatetracking;
};


