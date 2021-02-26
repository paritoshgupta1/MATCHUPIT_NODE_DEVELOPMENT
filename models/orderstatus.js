'use strict';
module.exports = (sequelize, DataTypes) => {
  const orderstatus = sequelize.define('orderstatus', {
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {});
  orderstatus.associate = function(models) {
    // associations can be defined here
  };
  return orderstatus;
};