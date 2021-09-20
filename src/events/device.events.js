/* eslint-disable no-param-reassign */
const aedesService = require("../services/mqtt.services");

exports.deviceUpdated = (device) => {
  if (device) {
    delete device.secret;
    aedesService.publishToTopic(
      `${device.account_id}/${device.section_id}/${device.id}`,
      {
        data: device,
      }
    );
  }
};
