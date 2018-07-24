'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'email already registered'
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photo: { type: DataTypes.STRING },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    doctor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resetPasswordToken: { type: DataTypes.STRING },
    resetPasswordExpires: { type: DataTypes.DATE },
  }, {
      scopes: {
        profile: { attributes: { exclude: ['password'] } }
      },
      underscored: true
    });

  User.associate = function (models) {
    models.User.belongsToMany(models.Vitabox, { through: models.UserVitabox });
    models.User.belongsToMany(models.Patient, { through: models.DoctorPatient });
  };

  return User;
};