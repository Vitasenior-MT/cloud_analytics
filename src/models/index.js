var mongoose = require('mongoose'),
    Sequelize = require('sequelize');

var mongo_uri = "", mysql_uri = "";

if (process.env.NODE_ENV === "production") {
    mongo_uri = 'mongodb://admin:MVJVTVJRQVCKVDCP@sl-eu-lon-2-portal.9.dblayer.com:26110,sl-eu-lon-2-portal.10.dblayer.com:26110/compose?authSource=admin&ssl=true';
    mysql_uri = 'mysql://admin:ZJBQRDMEHMADJHUQ@sl-eu-lon-2-portal.11.dblayer.com:26392/compose';
} else {
    mongo_uri = 'mongodb://192.168.161.53:27017/test';
    mysql_uri = 'mysql://api:123qwe@192.168.161.53:3306/test';
}

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
mongoose.connect(mongo_uri);
// Create a new connection to MySQL server
var sequelize = new Sequelize(mysql_uri, { operatorsAliases: operatorsAliases, logging: false });

const db = {
    'Boardmodel': require('./mysql/board_model')(sequelize, Sequelize),
    'Board': require('./mysql/board')(sequelize, Sequelize),
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
    'RecordOld': require('./mongodb/record_old'),
    'Warning': require('./mongodb/warning'),
    'WarningUnseen': require('./mongodb/warning_unseen')
}

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.mongoose = mongoose.connection;

module.exports = db;