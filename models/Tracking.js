'use strict';
module.exports = (sequelize, DataTypes) => {
  const tracking = sequelize.define('tracking', {
    
    trackingdate: DataTypes.STRING,
    login: DataTypes.INTEGER,
    search: DataTypes.INTEGER,
    messenger: DataTypes.INTEGER,
    community: DataTypes.INTEGER,
    news: DataTypes.INTEGER
  }, {});
  tracking.associate = function(models) {
    // associations can be defined here
  };
  return tracking;
};


