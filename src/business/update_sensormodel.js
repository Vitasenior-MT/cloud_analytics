var db = require('../models/index');

exports.add = (attributes) => {
    return new Promise((resolve, reject) => {
        db.Boardmodel.findOne({ where: { id: attributes.boardmodel_id }, include: [{ model: db.Board, include: [{ model: db.Patient }, { model: db.Vitabox }] }] })
            .then(boardmodel => {
                let promises = [];
                boardmodel.Boards.forEach(board => {
                    promises.push(new Promise((resolve, reject) => {
                        db.Sensor.create({ board_id: board.id, sensormodel_id: attributes.sensormodel.id }).then(() => resolve()).catch(err => reject(err))
                    }));
                    board.Patients.forEach(patient => {
                        promises.push(new Promise((resolve, reject) => {
                            db.Profile.findOrCreate({ where: { patient_id: patient.id, tag: attributes.sensormodel.tag }, defaults: { min_diurnal: attributes.sensormodel.min_acceptable, min_nightly: attributes.sensormodel.min_acceptable, max_diurnal: attributes.sensormodel.max_acceptable, max_nightly: attributes.sensormodel.max_acceptable, measure: attributes.sensormodel.measure } }).then(() => resolve()).catch(err => reject(err))
                        }));
                    });
                });
                Promise.all(promises).then(
                    () => resolve({ forward: boardmodel.Boards.map(board => { return { room: board.vitabox_id, key: "update" } }) }),
                    error => reject(error.message));
            }, error => reject(error.message));
    });
}

exports.remove = (attributes) => {
    return new Promise((resolve, reject) => {
        db.Boardmodel.findOne({ where: { id: attributes.boardmodel_id }, include: [{ model: db.Board, include: [{ model: db.Patient }, { model: db.Vitabox }, { model: db.Sensor }] }] })
            .then(boardmodel => {
                let promises = [], sensors_ids = [].concat.apply([], boardmodel.Boards.map(board => { return board.Sensors.filter(x => x.sensormodel_id == attributes.sensormodel.id) })).map(x => x.id);

                promises.push(new Promise((resolve, reject) => {
                    db.Sensor.destroy({ where: { id: sensors_ids } }).then(() => resolve()).catch(err => reject(err))
                }));
                promises.push(new Promise((resolve, reject) => {
                    db.Record.deleteMany({ sensor_id: { $in: sensors_ids } }).exec(err => {
                        if (err) reject(err); else resolve();
                    });
                }));
                boardmodel.Boards.forEach(board => {
                    board.Patients.forEach(patient => {
                        promises.push(new Promise((resolve, reject) => {
                            db.Profile.destroy({ where: { patient_id: patient.id, tag: attributes.sensormodel.tag } }).then(() => resolve()).catch(err => reject(err))
                        }));
                    });
                });

                Promise.all(promises).then(
                    () => resolve({ forward: boardmodel.Boards.map(board => { return { room: board.vitabox_id, key: "update" } }) }),
                    error => reject(error.message));
            }, error => reject(error.message));

    });
}