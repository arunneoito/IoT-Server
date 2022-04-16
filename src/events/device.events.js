/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const aedesService = require("../services/mqtt.services");
const helpers = require("../../utils/helpers");
const LogService = require("../services/log.service");
const homeGraphService = require("../services/home-graph.service");
exports.deviceUpdated = (device) => {
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
        data,
      }
    );

    aedesService.publishToTopic(
      // eslint-disable-next-line no-underscore-dangle
      `${device.account_id}`,
      { data: device }
    );

    const states = device.channels.map((d) => ({
      [d.id]: {
        on: d.value === "true",
        online: true,
      },
    }));

    console.log(...states);

    const reportState = {
      agentUserId: device.account_id,
      requestId: Math.random().toString(),
      payload: {
        devices: {
          ...states,
        },
      },
    };

    console.log(reportState);

    homeGraphService.reportState(reportState);

    // LogService.createLog({});
  }
};
