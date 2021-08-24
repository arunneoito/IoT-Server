const deviceService = require("../services/device.service");

exports.disconnet = (client) => {
  deviceService.updateSubscription(client.device.id, client.id, client.connected);
};

exports.ack = (packet, client) => {
  console.log("message received to client : ", client.id);
};

exports.subscribe = (subscriptions, client) => {
  console.log("new client connected");
  console.log("name : ", client.device.name);
  console.log("id : ", client.id);
  deviceService.updateSubscription(client.device.id, client.id, client.connected);
};