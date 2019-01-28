'use strict';
module.exports = (sequelize, DataTypes) => {
  var Vitabox = sequelize.define('Vitabox', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    coordinates: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.STRING,
      defaultValue: null,
      validate: {
        notEmpty: {
          args: true,
          msg: "address must be defined"
        }
      }
    },
    registered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    connected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_commit: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    district: {
      type: DataTypes.STRING,
      defaultValue: null,
      validate: {
        notEmpty: {
          args: true,
          msg: "district must be defined"
        }
      }
    },
    locality: {
      type: DataTypes.STRING,
      defaultValue: null,
      validate: {
        notEmpty: {
          args: true,
          msg: "locality must be defined"
        }
      }
    },
    name: {
      type: DataTypes.STRING
    }
  }, { underscored: true });

  Vitabox.associate = function (models) {
    models.Vitabox.belongsToMany(models.User, { through: models.UserVitabox });
    models.Vitabox.hasMany(models.Patient);
    models.Vitabox.hasMany(models.Board);
  };

  return Vitabox;
};