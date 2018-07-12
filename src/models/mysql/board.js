'use strict';
module.exports = (sequelize, DataTypes) => {
  var Board = sequelize.define('Board', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    mac_addr: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'MAC address already in use'
      },
      validate: {
        is: {
          args: /^([0-9a-f]{2}[:]){7}([0-9a-f]{2})$/,
          msg: "MAC addres must be valid"
        }
      }
    },
    node_id: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: {
          args: /^([0-9a-f]{4})$/,
          msg: "Node id invalid"
        }
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, { underscored: true });

  Board.associate = function (models) {
    models.Board.belongsTo(models.Vitabox);
    models.Board.belongsTo(models.Boardmodel);
    models.Board.belongsToMany(models.Patient, { through: "PatientBoard" });
    models.Board.hasMany(models.Sensor);
  };

  return Board;
};