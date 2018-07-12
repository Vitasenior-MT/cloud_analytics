'use strict';
module.exports = (sequelize, DataTypes) => {
    var Patient = sequelize.define('Patient', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        birthdate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: {
                    msg: "patient name must be defined"
                }
            }
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
            validate: {
                notEmpty: {
                    msg: "patient gender must be defined"
                }
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        weight:{
            type: DataTypes.FLOAT(5, 2),
            allowNull: false,
            validate: {
              min: {
                args: 10,
                msg: "minimum weight acceptable value is 10kg"
              },
              max: {
                args: 300,
                msg: "maximum weight acceptable value is 300kg"
              }
            }
        },
        height:{
            type: DataTypes.FLOAT(5, 2),
            allowNull: false,
            validate: {
              min: {
                args: 0.5,
                msg: "minimum height acceptable value is 0.5m"
              },
              max: {
                args: 3,
                msg: "maximum height acceptable value is 3m"
              }
            }
        }
    }, { underscored: true });

    Patient.associate = function (models) {
        models.Patient.hasMany(models.Profile);
        models.Patient.belongsTo(models.Vitabox);
        models.Patient.belongsToMany(models.Board, { through: "PatientBoard" });
        models.Patient.belongsToMany(models.User, { through: "DoctorPatient" });
    };

    return Patient;
};