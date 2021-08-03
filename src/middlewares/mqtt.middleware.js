const jwt = require("jsonwebtoken");
const key =
  "t3CclFjHVf12zgOqSfoB3_jC1KetVSbW89TRQbmlfUeobkPaxHkehryI88VVQ_AymF0eYHQrzUOsa63_8XHOdJFjat9oAG7eXStZpTdkTrjSJCjWACYWgfUFxHpmsnof4XsxBihEDOYGiDoTu4A3U5Tx-IzQLRPjPhc0xfN7eswMSz4MdC9wXNFBH0H3mp_UMj2S3fJzHi5vzwCEuNXDpbqMQe2yHcXnYnXv2ZS71zrQN8RZAe0cUNGXzDRdw_p62zD2Bqt6HEz-rshJfYyJBT_ySuTx7khVw_iPgf27SkNCI-T4n-qRRal4TvdxjvtiKuIeMFHkxwER1jtj48FcMQ";

exports.mqttAuth = (client, username, password, callback) => {
  if (username === "oauth2") {
    return jwt.verify(password.toString(), key, (error, token) => {
      if (error) {
        console.log("Client verification failed");
        return callback(error, false);
      }
      client.token = token;
      return callback(null, true);
    });
  }
  return callback(null, false);
};
