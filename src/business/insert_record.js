var db = require('../models/index'),
  error = require('../business/error'),
  warning = require('../business/warning');

module.exports = (content) => {
  return new Promise((resolve, reject) => {
    _insertAllRecords(content.records).then(
      records => _updateLastCommits(records).then(
        () => _validateRecords(records).then(
          () => resolve(),
          err => reject(err.message)),
        err => reject(err.message)),
      err => reject(err.message));
  });
}

// PRIVATE
_insertAllRecords = (records) => {
  return new Promise((resolve, reject) => {
    records = records.filter(record => record.value && record.datetime && record.sensor_id && (!record.patient_id || record.patient_id !== ""));
    if (records.length > 0) {
      let promises = records.map(record => new Promise((resolve, reject) => {
        db.RecordTemp.create(record, (err, doc) => {
          if (err) error.insert(null, null, record.sensor_id, "cannot_insert_record", err.message).then(
            () => resolve(null),
            err => reject(err));
          else resolve(doc);
        });
      }));
      Promise.all(promises).then(
        records => resolve(records.filter(x => x)),
        err => reject(err));
    } else resolve([]);
  });
}

_updateLastCommits = (records) => {
  return new Promise((resolve, reject) => {
    let promises = records.map(record => new Promise((resolve, reject) => {
      db.Sensor.findById(record.sensor_id).then(
        sensor => {
          if (sensor) {
            let values = sensor.last_values ? sensor.last_values : [];
            values.unshift(record.value);
            if (values.length > 5) values.pop();
            sensor.update({ last_commit: record.datetime, last_values: values }).then(
              () => resolve(),
              err => reject(err));
          } else error.insert(null, null, record.sensor_id, "cannot_update_sensor", err.message).then(
            () => resolve(),
            err => reject(err));
        }, err => reject(err));
    }));
    Promise.all(promises).then(
      () => resolve(),
      err => reject(err));
  });
}

_validateRecords = (records) => {
  return new Promise((resolve, reject) => {
    if (records.length > 0) {
      let promises = records.map(record => {
        if (record.patient_id) return _verifyThresholdsFromPatient(record);
        else return _verifyThresholdsFromSensor(record);
      });
      Promise.all(promises).then(
        () => resolve(),
        err => reject(err));
    } else resolve();
  });
}

_verifyThresholdsFromPatient = (record) => {
  return new Promise((resolve, reject) => {
    Promise.all([
      db.Sensor.findById(record.sensor_id, { include: [{ model: db.Sensormodel }, { model: db.Board }] }),
      db.Patient.findById(record.patient_id, { include: [{ model: db.Profile }, { model: db.Vitabox }] })
    ]).then(
      result => {
        if (result[0] && result[1]) {
          let promises = [], sensor = result[0], patient = result[1];
          let profile = patient.Profiles.filter(x => x.tag === sensor.Sensormodel.tag)[0];
          // calculates average and standard deviation
          let avg = sensor.last_values.reduce((total, x) => total + x) / sensor.last_values.length;
          let std = Math.sqrt(sensor.last_values.map(x => Math.pow((x - avg), 2)).reduce((total, x) => total + x) / sensor.last_values.length);
          // verify any warning
          if (record.value > profile.max || record.value > (avg + std) || record.value < profile.min || record.value > (avg + std)) {
            // update last warning
            promises.push(sensor.update({ last_warning: new Date() }));
            // check limits of clinical profile
            if (record.value > profile.max) promises.push(warning.insert(patient.Vitabox.id, sensor.id, patient.id, "warning_up_limit"));
            if (record.value < profile.min) promises.push(warning.insert(patient.Vitabox.id, sensor.id, patient.id, "warning_down_limit"));
            // check for abnormal variation
            if (record.value > (avg + std)) promises.push(warning.insert(patient.Vitabox.id, sensor.id, patient.id, "warning_up_tending"));
            if (record.value > (avg + std)) promises.push(warning.insert(patient.Vitabox.id, sensor.id, patient.id, "warning_down_tending"));
          }
          // verify values out of range 
          if (record.value > sensor.Sensormodel.max_possible || record.value < sensor.Sensormodel.min_possible) promises.push(error.insert(patient.Vitabox.id, sensor.Board.id, sensor.id, "trespassing_thresholds", ""));

          Promise.all(promises).then(
            () => resolve(),
            err => reject(err));
        } else {
          if (!result[0]) error.insert("sensor", record.sensor_id, "cannot_find_sensor", err.message).then(
            () => resolve(),
            err => reject(err));
          resolve();
        }
      }, err => reject(err));
  });
}

_verifyThresholdsFromSensor = (record) => {
  return new Promise((resolve, reject) => {
    db.Sensor.findById(record.sensor_id, { include: [{ model: db.Sensormodel }, { model: db.Board, include: [{ model: db.Vitabox }] }] }).then(
      sensor => {
        if (sensor) {
          let promises = [];
          // calculates average and standard deviation
          let avg = sensor.last_values.reduce((total, x) => total + x) / sensor.last_values.length;
          let std = Math.sqrt(sensor.last_values.map(x => Math.pow((x - avg), 2)).reduce((total, x) => total + x) / sensor.last_values.length);
          // verify any warning
          if (record.value > sensor.Sensormodel.max_acceptable || record.value > (avg + std) || record.value < sensor.Sensormodel.min_acceptable || record.value > (avg + std)) {
            // update last warning
            promises.push(sensor.update({ last_warning: new Date() }));
            // checks by sensor limits
            if (record.value > sensor.Sensormodel.max_acceptable) promises.push(warning.insert(sensor.Board.Vitabox.id, sensor.id, null, "warning_up_limit"));
            if (record.value < sensor.Sensormodel.min_acceptable) promises.push(warning.insert(sensor.Board.Vitabox.id, sensor.id, null, "warning_down_limit"));
            // check for abnormal variation
            if (record.value > (avg + std)) promises.push(warning.insert(sensor.Board.Vitabox.id, sensor.id, null, "warning_up_tending"));
            if (record.value > (avg + std)) promises.push(warning.insert(sensor.Board.Vitabox.id, sensor.id, null, "warning_down_tending"));
          }
          // verify values out of range 
          if (record.value > sensor.Sensormodel.max_possible || record.value < sensor.Sensormodel.min_possible) promises.push(error.insert(sensor.Board.Vitabox.id, sensor.Board.id, sensor.id, "trespassing_thresholds", ""));

          Promise.all(promises).then(
            () => resolve(),
            err => reject(err));
        } else error.insert("sensor", record.sensor_id, "cannot_find_sensor", err.message).then(
          () => resolve(),
          err => reject(err));
      }, err => reject(err));
  });
}