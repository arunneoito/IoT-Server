/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const aedesService = require("../services/mqtt.services");
const helpers = require("../../utils/helpers");

exports.deviceUpdated = (device) => {
  console.log(device);
  if (device) {
    const data = device.channels.map((d) => ({
      port: d.port,
      value: d.value,
      valueType: d.value_type,
      inout: d.inout,
    }));

    delete device.secret;
    aedesService.publishToTopic(
      // eslint-disable-next-line no-underscore-dangle
      helpers.getDeviceTopic(device),
      {
        data:data,
        deviceId: device._id.toString(),
      }
    );
  }
};
