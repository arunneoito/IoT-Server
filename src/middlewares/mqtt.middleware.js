/* eslint-disable no-param-reassign */

const deviceService = require("../services/device.service");

exports.mqttAuth = (client, username, password, callback) => {
  deviceService.findByIdAndSecret(username, password).then((d) => {
    if (d) {
      client.device = d;
      return callback(null, true);
    }
    return callback(null, false);
  });
};

exports.mqttSubAuth = (client, sub, callback) => {
  if (sub.topic === client.device.id) {
    sub.topic = `${client.device.section_id}/${client.device.id}`;
    return callback(null, sub);
  }
  console.log("connection refused");
  return callback(new Error('wrong topic'), null);
};
