var db = require('../models/index'),
  error = require('../business/error'),
  warning = require('../business/warning');

module.exports = (content) => {
  return new Promise((resolve, reject) => {
    let error = false, checked = null;
    console.log("\x1b[36mreceived: %s records\x1b[0m", content.records.length);
    _prepareRecords(content.records).then(data => {
      if (process.env.NODE_ENV === "development") console.log("prepared");
      if (data.error) error = true;
      checked = data.data;
      return _insertAllRecords(checked);
    }).then(has_error => {
      if (process.env.NODE_ENV === "development") console.log("inserted");
      if (has_error) error = true;
      return _updateLastCommits(checked);
    }).then(has_error => {
      if (process.env.NODE_ENV === "development") console.log("updated");
      if (has_error) error = true;
      return _validateRecords(checked);
    }).then(warnings => {
      if (process.env.NODE_ENV === "development") console.log("validated");
      let warnings_to_send = [];
      warnings.forEach(w => {
        warnings_to_send.push({ room: w.vitabox, key: "warning_" + w.type });
        if (w.patient !== null) warnings_to_send.push({ room: w.patient, key: "warning_" + w.type });
      });

      if (error) resolve({ forward: [{ room: "admin", key: "error" }].concat(warnings_to_send) });
      else resolve({ forward: warnings_to_send });
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
          let promises_1 = [db.Sensor.findOne({ where: { id: record.sensor_id }, include: [{ model: db.Sensormodel }, { model: db.Board, include: [{ model: db.Vitabox }] }] })];
          if (record.patient_id) promises_1.push(db.Patient.findOne({ where: { id: record.patient_id }, include: [{ model: db.Profile }] }));
          Promise.all(promises_1).then(
            res => {
              if (res[0]) if (res[0].Board.get_warnings) resolve({
                record: record,
                sensor: res[0],
                patient: record.patient_id ? res[1] : null
              });
              else resolve(null);
              else error.insert(null, null, record.sensor_id, "cannot_update_sensor", "sensor not found").then(
                () => resolve(null),
                err => reject(err));
            });
        });
      });
      Promise.all(promises_all)
        .then(res => resolve({ error: res.filter(x => x).length < records, data: res.filter(x => x) }))
        .catch(err => reject(err));
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
      let promises = [];
      if (d.patient) {
        let profile = d.patient.Profiles.find(x => x.tag === d.sensor.Sensormodel.tag);
        let values = profile.last_values ? profile.last_values : [];
        values.unshift(d.record.value);
        if (values.length > 5) values.pop();

        promises.push(
          new Promise((resolve, reject) =>
            db.Profile.update({ last_values: values }, { where: { patient_id: d.patient.id, tag: d.sensor.Sensormodel.tag } }).then(
              () => resolve(false),
              err => error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_update_profile", err.message).then(
                () => resolve(true),
                err => reject(err)))
          ));
        promises.push(
          new Promise((resolve, reject) =>
            db.PatientBoard.update({ last_commit: new Date() }, { where: { patient_id: d.patient.id, board_id: d.sensor.Board.id } }).then(
              () => resolve(false),
              err => error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_update_board", err.message).then(
                () => resolve(true),
                err => reject(err)))
          ));
        promises.push(
          new Promise((resolve, reject) =>
            d.sensor.update({ last_commit: new Date() }).then(
              () => resolve(false),
              err => error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_update_sensor", err.message).then(
                () => resolve(true),
                err => reject(err)))));
      } else {
        let values = d.sensor.last_values ? d.sensor.last_values : [];
        values.unshift(d.record.value);
        if (values.length > 5) values.pop();

        promises.push(
          new Promise((resolve, reject) =>
            d.sensor.update({ last_commit: new Date(), last_values: values }).then(
              () => resolve(false),
              err => error.insert(d.sensor.Board.Vitabox.id, d.sensor.Board.id, d.sensor.id, "cannot_update_sensor", err.message).then(
                () => resolve(true),
                err => reject(err)))));
      }
      return promises;
    });

    let mashed = Object.keys(promises_all).reduce((arr, key) => {
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

    let promises = [], res = null, avg = 0, std2 = 0, min_acceptable = 0, max_acceptable = 0;
    let profile = data.patient.Profiles.find(x => x.tag === data.sensor.Sensormodel.tag);
    // calculates average and standard deviation
    let has_previous_values = profile.last_values ? (profile.last_values.length > 0 ? true : false) : false;
    if (has_previous_values) {
      avg = profile.last_values.reduce((total, x) => total + x) / profile.last_values.length;
      std2 = (Math.sqrt(profile.last_values.map(x => Math.pow((x - avg), 2)).reduce((total, x) => total + x) / profile.last_values.length)) * 2;
    }
    // get profile to respective hour
    let datetime = new Date(data.record.datetime).getHours();
    if (datetime >= 9 && datetime < 18) {
      max_acceptable = profile.max_diurnal;
      min_acceptable = profile.min_diurnal;
    } else {
      max_acceptable = profile.max_nightly;
      min_acceptable = profile.min_nightly;
    }
    // verify any warning
    if (
      data.record.value > max_acceptable ||
      (has_previous_values && data.record.value > (avg + std2)) ||
      data.record.value < min_acceptable ||
      (has_previous_values && data.record.value < (avg - std2))
    ) {
      res = { vitabox: data.sensor.Board.Vitabox.id, type: "bio", patient: data.patient.id };
      // update last warning
      promises.push(data.sensor.update({ last_warning: new Date() }));
      promises.push(warning.countDoctor(data.patient.id));
      promises.push(warning.countVitabox(data.sensor.Board.Vitabox.id));
      // check limits of clinical profile
      if (data.record.value > max_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_up_limit"));
      if (data.record.value < min_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_down_limit"));
      // check for abnormal variation
      if (has_previous_values) {
        if (data.record.value > (avg + std2) && data.record.value < max_acceptable)
          promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_up_tending"));
        if (data.record.value < (avg - std2) && data.record.value > min_acceptable)
          promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, data.patient.id, "warning_down_tending"));
      }
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
    let promises = [], res = null, avg = 0, std2 = 0;
    // calculates average and standard deviation
    let has_previous_values = data.sensor.last_values ? (data.sensor.last_values.length > 0 ? true : false) : false;
    if (has_previous_values) {
      avg = data.sensor.last_values.reduce((total, x) => total + x) / data.sensor.last_values.length;
      std2 = (Math.sqrt(data.sensor.last_values.map(x => Math.pow((x - avg), 2)).reduce((total, x) => total + x) / data.sensor.last_values.length)) * 2;
    }
    // verify any warning
    if (
      data.record.value > data.sensor.Sensormodel.max_acceptable ||
      (has_previous_values && data.record.value > (avg + std2)) ||
      data.record.value < data.sensor.Sensormodel.min_acceptable ||
      (has_previous_values && data.record.value < (avg - std2))
    ) {
      res = { vitabox: data.sensor.Board.Vitabox.id, type: "env", patient: null };
      // update last warning
      promises.push(data.sensor.update({ last_warning: new Date() }));
      promises.push(warning.countVitabox(data.sensor.Board.Vitabox.id));
      // checks by sensor limits
      if (data.record.value > data.sensor.Sensormodel.max_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_up_limit"));
      if (data.record.value < data.sensor.Sensormodel.min_acceptable)
        promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_down_limit"));
      // check for abnormal variation
      if (has_previous_values) {
        if (data.record.value > (avg + std2) && data.record.value < data.sensor.Sensormodel.max_acceptable)
          promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_up_tending"));
        if (data.record.value < (avg - std2) && data.record.value > data.sensor.Sensormodel.min_acceptable)
          promises.push(warning.insert(data.sensor.Board.Vitabox.id, data.sensor.id, null, "warning_down_tending"));
      }
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

