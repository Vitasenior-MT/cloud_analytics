'use strict';
module.exports = (sequelize, DataTypes) => {
  var UserVitabox = sequelize.define('UserVitabox', {
    sponsor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, { underscored: true });

  return UserVitabox;
};