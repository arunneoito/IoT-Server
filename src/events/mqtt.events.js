

exports.disconnet = (client) => {
  console.log("client disconnected : ", client.id);
};

exports.ack = (packet, client) => {
  console.log("message received to client : ", client.id);
};

exports.subscribe = (subscriptions, client) => {
  console.log("client subscribed : ", client.id);
};
