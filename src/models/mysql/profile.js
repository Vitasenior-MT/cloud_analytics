'use strict';
module.exports = (sequelize, DataTypes) => {
  var Profile = sequelize.define('Profile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    measure: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        notEmpty: {
          msg: "measure init must be defined"
        }
      }
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        notEmpty: {
          msg: "measure tag must be defined"
        }
      }
    },
    min_nightly: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "minimum acceptable value must be defined"
        }
      }
    },
    max_nightly: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "maximum acceptable value must be defined"
        }
      }
    },
    min_diurnal: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "minimum acceptable value must be defined"
        }
      }
    },
    max_diurnal: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "maximum acceptable value must be defined"
        }
      }
    },
    last_values: { type: DataTypes.JSON },
  }, { underscored: true });

  Profile.associate = function (models) {
    models.Profile.belongsTo(models.Patient);
  };

  return Profile;
};