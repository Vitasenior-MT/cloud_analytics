module.exports = (sequelize, DataTypes) => {
  var PatientBoard = sequelize.define('PatientBoard', {
    schedules: {
      type: DataTypes.JSON
    },
    frequency: {
      type: DataTypes.TINYINT(2).UNSIGNED,
      allowNull: true,
      defaultValue: null
    },
    last_commit: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
  }, { underscored: true });

  PatientBoard.associate = function (models) {
    models.PatientBoard.belongsTo(models.Board);
    models.PatientBoard.belongsTo(models.Patient);
  };

  return PatientBoard;
};