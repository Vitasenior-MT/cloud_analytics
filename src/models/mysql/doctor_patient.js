'use strict';
module.exports = (sequelize, DataTypes) => {
  var UserVitabox = sequelize.define('DoctorPatient', {
    accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, { underscored: true });

  return UserVitabox;
};