'use strict';
module.exports = (sequelize, DataTypes) => {
  const corporatemastermapping = sequelize.define('corporatemastermapping', {
    corporateId: DataTypes.STRING,
    subId: DataTypes.STRING,
    name: DataTypes.STRING,
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    email: {
      type: DataTypes.STRING
    },
    is_master: {
      type: DataTypes.BOOLEAN
    }
  }, {});
  corporatemastermapping.associate = function(models) {
    // associations can be defined here
  };
  return corporatemastermapping;
};