/* eslint-disable no-param-reassign */
const aedesService = require("../services/mqtt.services");

exports.deviceUpdated = (device) => {
  console.log(device);
  delete device.secret;
  aedesService.publishToTopic(
    `${device.account_id}/${device.section_id}/${device.id}`,
    {
      message: device.name,
      channels: device.channels.map((d) => ({
        value: d.value,
      })),
    }
  );
};
