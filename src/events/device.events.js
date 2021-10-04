/* eslint-disable no-param-reassign */
const aedesService = require("../services/mqtt.services");

exports.deviceUpdated = (device) => {
  console.log(`${device.account_id}/${device.section_id}/${device._id}`);
  if (device) {
    delete device.secret;
    aedesService.publishToTopic(
      // eslint-disable-next-line no-underscore-dangle
      `${device.account_id}/${device.section_id}/${device._id}`,
      {
        data: device,
      }
    );
  }
};
