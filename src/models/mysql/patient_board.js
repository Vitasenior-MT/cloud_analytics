module.exports = (sequelize, DataTypes) => {
  var PatientBoard = sequelize.define('PatientBoard', {
    frequency: {
      type: DataTypes.INTEGER(2).UNSIGNED,
      allowNull: true,
      defaultValue: null
    },
    last_commit: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, { underscored: true });

  return PatientBoard;
};