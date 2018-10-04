var db = require('../models/index'),
  error = require('../business/error'),
  warning = require('../business/warning');

module.exports = (content) => {
  return new Promise((resolve, reject) => {
    let error = false, checked = null;
    console.log("\x1b[31m1\x1b[0m - received");
    _prepareRecords(content.records).then(data => {
      console.log("\x1b[31m2\x1b[0m - prepared, any error: ", data.error);
      if (data.error) error = true;
      checked = data.data;
      return _insertAllRecords(checked);
    }).then(has_error => {
      console.log("\x1b[35m3\x1b[0m - inserted, any error: ", has_error);
      if (has_error) error = true;
      return _updateLastCommits(checked);
    }).then(has_error => {
      console.log("\x1b[34m4\x1b[0m - updated, any error: ", has_error);
      if (has_error) error = true;
      return _validateRecords(checked);
    }).then(warnings => {
      console.log("\x1b[36m5\x1b[0m - validated,  any error: ", error, "warning: ", warnings.length > 0);
      if (error) resolve({ forward: [{ room: "admin", key: "error" }].concat(warnings.map(w => { return { room: w.vitabox, key: "warning_" + w.type } })) });
      else resolve({ forward: warnings.map(w => { return { room: w.vitabox, key: "warning_" + w.type } }) });
    }).catch(err => reject(err.message));
  });
}

// PRIVATE
_prepareRecords = (records) => {
  return new Promise((resolve, reject) => {
    records = records.filter(record => record.value !== undefined && record.value !== null && record.datetime && record.sensor_id && (!record.patient_id || record.patient_id !== ""));
    if (records.length > 0) {
      let promises_all = records.map(record => {
        return new Promise((resolve, reject) => {
          let promises_1 = [db.Sensor.findById(record.sensor_id, { include: [{ model: db.Sensormodel }, { model: db.Board, include: [{ model: db.Vitabox }] }] })];
          if (record.patient_id) promises_1.push(db.Patient.findById(record.patient_id, { include: [{ model: db.Profile }] }));
          Promise.all(promises_1).then(
            res => {
              if (res[0]) resolve({
                record: record,
                sensor: res[0],
                patient: record.patient_id ? res[1] : null
              });
              else error.insert(null, null, record.sensor_id, "cannot_update_sensor", "sensor not found").then(
                () => resolve(null),
                err => reject(err));
            });
        });
      });
      Promise.all(promises_all).then(
        res => resolve({
          error: res.filter(x => x).length < records,
          data: res.filter(x => x)
        }),
        err => reject(err));
    } else { resolve([]) }
  });
}

_insertAllRecords = (data) => {
  return new Promise((resolve, reject) => {
    let promises = data.map(d => new Promise((resolve, reject) => {
      db.Record.create({
        value: Math.round(d.record.value * 100) / 100,
        datetime: d.record.datetime,
        sensor_id: d.sensor.id,
        patient_id: d.patient ? d.patient.id : null
      }, (err, doc) => {
        if (err) error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_insert_record", err.message).then(
          () => resolve(true),
          err => reject(err));
        else resolve(false);
      });
    }));
    Promise.all(promises).then(
      res => resolve(res.some(x => x === true)),
      err => reject(err));
  });
}

_updateLastCommits = (data) => {
  return new Promise((resolve, reject) => {
    let promises_all = data.map(d => {
      let values = d.sensor.last_values ? d.sensor.last_values : [];
      values.unshift(d.record.value);
      if (values.length > 5) values.pop();

      let promises_1 = [
        new Promise((resolve, reject) =>
          d.sensor.update({ last_commit: new Date(), last_values: values }).then(
            () => resolve(false),
            err => error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_update_sensor", err.message).then(
              () => resolve(true),
              err => reject(err))))
      ];
      if (d.patient) promises_1.push(
        new Promise((resolve, reject) =>
          db.PatientBoard.update({ last_commit: new Date() }, { where: { patient_id: d.patient.id, board_id: d.sensor.Board.id } }).then(
            () => resolve(false),
            err => error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_update_board", err.message).then(
              () => resolve(true),
              err => reject(err)))
        ));

      return promises_1;
    });

    var mashed = Object.keys(data).reduce(function (arr, key) {
      return arr.concat(data[key]);
    }, []);

    Promise.all(mashed).then(
      res => resolve(res.some(x => x === true)),
      err => reject(err));
  });
}

_validateRecords = (data) => {
  return new Promise((resolve, reject) => {
    let promises = data.map(d => {
      if (d.patient) return _verifyThresholdsFromPatient(d);
      else return _verifyThresholdsFromSensor(d);
    });
    Promise.all(promises).then(
      res => resolve(res.filter(x => x !== null)),
      err => reject(err));
  });
}

_verifyThresholdsFromPatient = (data) => {
  return new Promise((resolve, reject) => {

    let promises = [], res = null;
    let profile = data.patient.Profiles.filter(x => x.tag === data.sensor.Sensormodel.tag)[0];
    // calculates average and standard deviation
    let avg = data.sensor.last_values.reduce((total, x) => total + x) / data.sensor.last_values.length;
    let std = Math.sqrt(data.sensor.last_values.map(x => Math.pow((x - avg), 2)).reduce((total, x) => total + x) / data.sensor.last_values.length);
    // verify any warning
    if (data.record.value > profile.max || data.record.value > (avg + std) || data.record.value < profile.min || data.record.value > (avg + std)) {
      res = { vitabox: data.sensor.Board.Vitabox.id, type: "bio" };
      // update last warning
      promises.push(data.sensor.update({ last_warning: new Date() }));
      promises.push(warning.countDoctor(data.patient.id));
      promises.push(warning.countVitabox(data.sensor.Board.Vitabox.id));
      // check limits of clinical profile
      if (data.record.value > profile.max)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_up_limit"));
      if (data.record.value < profile.min)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_down_limit"));
      // check for abnormal variation
      if (data.record.value > (avg + std) && data.record.value < profile.max)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_up_tending"));
      if (data.record.value < (avg - std) && data.record.value > profile.min)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_down_tending"));
    }
    // verify values out of range 
    if (data.record.value > data.sensor.Sensormodel.max_possible || data.record.value < data.sensor.Sensormodel.min_possible) {
      promises.push(error.insert(data.patient.Vitabox.id, data.sensor.Board.id, data.sensor.id, "trespassing_thresholds", ""));
    }

    Promise.all(promises).then(
      () => resolve(res),
      err => reject(err));
  });
}

_verifyThresholdsFromSensor = (data) => {
  return new Promise((resolve, reject) => {
    let promises = [], res = null;
    // calculates average and standard deviation
    let avg = data.sensor.last_values.reduce((total, x) => total + x) / data.sensor.last_values.length;
    let std = Math.sqrt(data.sensor.last_values.map(x => Math.pow((x - avg), 2)).reduce((total, x) => total + x) / data.sensor.last_values.length);
    // verify any warning
    if (data.record.value > data.sensor.Sensormodel.max_acceptable || data.record.value > (avg + std) || data.record.value < data.sensor.Sensormodel.min_acceptable || data.record.value > (avg + std)) {
      res = { vitabox: data.sensor.Board.Vitabox.id, type: "env" };
      // update last warning
      promises.push(data.sensor.update({ last_warning: new Date() }));
      promises.push(warning.countVitabox(data.sensor.Board.Vitabox.id));
      // checks by sensor limits
      if (data.record.value > data.sensor.Sensormodel.max_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_up_limit"));
      if (data.record.value < data.sensor.Sensormodel.min_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_down_limit"));
      // check for abnormal variation
      if (data.record.value > (avg + std) && data.record.value < data.sensor.Sensormodel.max_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_up_tending"));
      if (data.record.value < (avg - std) && data.record.value > data.sensor.Sensormodel.min_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_down_tending"));
    }
    // verify values out of range 
    if (data.record.value > data.sensor.Sensormodel.max_possible || data.record.value < data.sensor.Sensormodel.min_possible) {
      promises.push(error.insert(data.sensor.Board.Vitabox.id, data.sensor.Board.id, data.sensor.id, "trespassing_thresholds", ""));
    }

    Promise.all(promises).then(
      () => resolve(res),
      err => reject(err));
  });
}

