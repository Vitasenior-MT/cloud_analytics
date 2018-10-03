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
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: {
          args: -90,
          msg: "latitude minimum acceptable value is -90"
        },
        max: {
          args: 90,
          msg: "latitude maximum acceptable value is 90"
        }
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: {
          args: -180,
          msg: "longitude minimum acceptable value is -180"
        },
        max: {
          args: 180,
          msg: "longitude maximum acceptable value is 180"
        }
      }
    },
    settings: {
      type: DataTypes.JSON,
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
    }
  }, { underscored: true });

  Vitabox.associate = function (models) {
    models.Vitabox.belongsToMany(models.User, { through: models.UserVitabox });
    models.Vitabox.hasMany(models.Patient);
    models.Vitabox.hasMany(models.Board);
  };

  return Vitabox;
};