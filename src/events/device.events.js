/* eslint-disable no-param-reassign */
const aedesService = require("../services/mqtt.services");
const helpers = require("../../utils/helpers");

exports.deviceUpdated = (device) => {
  if (device) {
    delete device.secret;
    aedesService.publishToTopic(
      // eslint-disable-next-line no-underscore-dangle
      helpers.getDeviceTopic(device),
      {
        data: JSON.stringify(device.channels),
      }
    );
  }
};
