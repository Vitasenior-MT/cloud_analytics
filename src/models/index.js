var mongoose = require('mongoose'),
    Sequelize = require('sequelize');

const operatorsAliases = {
    $eq: Sequelize.Op.eq,
    $ne: Sequelize.Op.ne,
    $gte: Sequelize.Op.gte,
    $gt: Sequelize.Op.gt,
    $lte: Sequelize.Op.lte,
    $lt: Sequelize.Op.lt,
    $not: Sequelize.Op.not,
    $in: Sequelize.Op.in,
    $notIn: Sequelize.Op.notIn,
    $is: Sequelize.Op.is,
    $like: Sequelize.Op.like,
    $notLike: Sequelize.Op.notLike,
    $iLike: Sequelize.Op.iLike,
    $notILike: Sequelize.Op.notILike,
    $regexp: Sequelize.Op.regexp,
    $notRegexp: Sequelize.Op.notRegexp,
    $iRegexp: Sequelize.Op.iRegexp,
    $notIRegexp: Sequelize.Op.notIRegexp,
    $between: Sequelize.Op.between,
    $notBetween: Sequelize.Op.notBetween,
    $overlap: Sequelize.Op.overlap,
    $contains: Sequelize.Op.contains,
    $contained: Sequelize.Op.contained,
    $adjacent: Sequelize.Op.adjacent,
    $strictLeft: Sequelize.Op.strictLeft,
    $strictRight: Sequelize.Op.strictRight,
    $noExtendRight: Sequelize.Op.noExtendRight,
    $noExtendLeft: Sequelize.Op.noExtendLeft,
    $and: Sequelize.Op.and,
    $or: Sequelize.Op.or,
    $any: Sequelize.Op.any,
    $all: Sequelize.Op.all,
    $values: Sequelize.Op.values,
    $col: Sequelize.Op.col
};

// Create a new conntection to MongoDB server
mongoose.connect(process.env.MONGODB);
// Create a new connection to MySQL server
var sequelize = new Sequelize(process.env.MYSQL, { operatorsAliases: operatorsAliases, logging: false });

const db = {
    'Boardmodel': require('./mysql/board_model')(sequelize, Sequelize),
    'Board': require('./mysql/board')(sequelize, Sequelize),
    'DoctorPatient': require('./mysql/doctor_patient')(sequelize, Sequelize),
    'PatientBoard': require('./mysql/patient_board')(sequelize, Sequelize),
    'Patient': require('./mysql/patient')(sequelize, Sequelize),
    'Profile': require('./mysql/profile')(sequelize, Sequelize),
    'Sensormodel': require('./mysql/sensor_model')(sequelize, Sequelize),
    'Sensor': require('./mysql/sensor')(sequelize, Sequelize),
    'UserVitabox': require('./mysql/user_vitabox')(sequelize, Sequelize),
    'User': require('./mysql/user')(sequelize, Sequelize),
    'Vitabox': require('./mysql/vitabox')(sequelize, Sequelize),

    'Error': require('./mongodb/error'),
    'Log': require('./mongodb/log'),
    'Profilemeasure': require('./mongodb/profile_measure'),
    'Profilemodel': require('./mongodb/profile_model'),
    'Record': require('./mongodb/record'),
    'Warning': require('./mongodb/warning'),
    'WarningUser': require('./mongodb/warning_user'),
    'WarningDoctor': require('./mongodb/warning_doctor')
}

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.mongoose = mongoose.connection;

module.exports = db;