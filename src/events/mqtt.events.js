const deviceService = require("../services/device.service");
const aedesService = require("../services/mqtt.services");

exports.disconnet = (client) => {
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
  if (client.device) {
    deviceService.updateSubscription(
      client.device.id,
      client.id,
      client.connected
    );
    aedesService.publishToTopic(
      `${client.device.section_id}/${client.device.id}`,
      {
        message: client.device.name,
        channels: client.device.channels.map((d) => ({
          value: d.value,
          type: d.type,
        })),
      }
    );
  }
};
