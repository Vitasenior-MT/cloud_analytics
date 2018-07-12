'use strict';
module.exports = (sequelize, DataTypes) => {
  var Sensormodel = sequelize.define('Sensormodel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transducer: {
      type: DataTypes.STRING
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
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'board tag already registered'
      }
    },
    min_acceptable: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "minimum acceptable value must be defined"
        }
      }
    },
    max_acceptable: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "maximum acceptable value must be defined"
        }
      }
    },
    min_possible: {
      type: DataTypes.DECIMAL(10, 5),
      allowNull: false,
      validate: {
        isDecimal: {
          args: true,
          msg: "minimum possible value must be defined"
        }
      }
    },
    max_possible: {
      type: DataTypes.DECIMAL(10, 5),
      validate: {
        isDecimal: {
          args: true,
          msg: "maximum possible value must be defined"
        }
      }
    }
  }, { underscored: true });

  Sensormodel.associate = function (models) {
    models.Sensormodel.belongsToMany(models.Boardmodel, { through: "BoardmodelSensor" });
    models.Sensormodel.hasMany(models.Sensor);
  };

  return Sensormodel;
};