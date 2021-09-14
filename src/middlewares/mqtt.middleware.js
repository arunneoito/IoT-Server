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
  if (sub.topic === `${client.device.section_id}/#`) {
    return callback(null, sub);
  }
  return callback(new Error("wrong topic"), null);
};

// eslint-disable-next-line consistent-return
exports.mqttPublishAuth = (client, packet, callback) => {
  if (!client.device.secret || !client.device.connected) {
    return callback(new Error("Invalid Request"));
  }
  callback(null);
};
