const aedes = require("../../index");

exports.publishToTopic = (topic, data) => {
  aedes.Aedes.publish({
    cmd: "publish",
    messageId: 42,
    qos: 2,
    dup: false,
    topic,
    payload: Buffer.from(JSON.stringify(data)),
    retain: false,
    properties: {
      // optional properties MQTT 5.0
      payloadFormatIndicator: true,
      messageExpiryInterval: 4321,
      topicAlias: 100,
      responseTopic: "topic",
      correlationData: Buffer.from([1, 2, 3, 4]),
      userProperties: {
        test: "test",
      },
      // eslint-disable-next-line max-len
      subscriptionIdentifier: 120, // can be an Array in message from broker, if message included in few another subscriptions
      contentType: "test",
    },
  });
};
