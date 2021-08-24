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
