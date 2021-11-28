'use strict';
module.exports = (sequelize, DataTypes) => {
  const jobspost = sequelize.define('jobspost', {
    
    corpid: DataTypes.STRING,
    corpname: DataTypes.STRING,
    jobtitle: DataTypes.STRING,
    jobcountry: DataTypes.STRING,
    jobstate: DataTypes.STRING,
    jobzipcode: DataTypes.STRING,
    compensation: DataTypes.STRING,
    emptype: DataTypes.STRING,
    industry: DataTypes.STRING,
    jobtitles: DataTypes.STRING,
    isremote: DataTypes.INTEGER,
    role: DataTypes.STRING,
    skillsp: DataTypes.STRING,
    skillso: DataTypes.STRING,
    description: DataTypes.STRING,
    jobstatus: DataTypes.STRING
  }, {});
  jobspost.associate = function(models) {
    // associations can be defined here
  };
  return jobspost;
};


