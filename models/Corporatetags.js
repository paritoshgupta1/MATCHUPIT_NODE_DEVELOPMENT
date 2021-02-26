'use strict';
module.exports = (sequelize, DataTypes) => {
  const corporatetags = sequelize.define('corporatetags', {
    corporateId: DataTypes.STRING,
    individualId: DataTypes.STRING,
    comments: DataTypes.STRING(255),
    createdOn: DataTypes.DATE,
    shortlisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    favourite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    masterId: DataTypes.STRING
  }, {});
  corporatetags.associate = function(models) {
    // associations can be defined here
  };
  return corporatetags;
};