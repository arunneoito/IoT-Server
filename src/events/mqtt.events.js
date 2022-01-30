const deviceService = require("../services/device.service");
const aedesService = require("../services/mqtt.services");
const helperFunctions = require("../../utils/helpers");

exports.disconnet = (client) => {
  console.log("client disconnect");
  if (client.device) {
    deviceService.updateSubscription(
      client.device.id,
      client.id,
      client.connected
    );
  }
};

exports.ack = (packet, client) => {
  console.log("message received to client : ", client.id);
};

exports.publish = (packet, client) => {
  if (packet.topic.includes("channels")) {
    console.log(packet.payload.toString());
    console.log(client.device);
  }
};

exports.subscribe = (subscriptions, client) => {
  if (!client.device) return;

  deviceService.updateSubscription(
    client.device.id,
    client.id,
    client.connected
  );

  if (client.device.channels.length === 0) {
    deviceService
      .getDeviceChannels({
        device: client.device,
        name: client.id.split("-")[0],
      })
      .then((device) => {
        aedesService.publishToTopic(
          helperFunctions.getDeviceTopic(client.device),
          {
            message: client.device.name,
            channels: device.channels.map((d) => ({
              value: d.value,
              type: d.type,
            })),
          }
        );
      });
  } else {
    aedesService.publishToTopic(helperFunctions.getDeviceTopic(client.device), {
      message: client.device.name,
      channels: client.device.channels.map((d) => ({
        value: d.value,
        type: d.type,
      })),
    });
  }
};
