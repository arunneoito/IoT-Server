const mqtt = require('mqtt');

const client = mqtt.connect({
  username: 'oauth2',

  // This token was generated using https://jwt.io/
  // The secret is: `something-secret`
  // It decodes to:
  // { "sub": "someone", "scope": "aedea-write aedes-read" }
  password: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.k-T2wzNgM2tSAVbHXXzcj8SE741Z3cU5FZrx4529atM",
});

client.on('connect', () => console.info('connected'));
client.on('disconnect', () => console.info('disconnect'));
client.on('error', (e)=>{console.log(e);process.exit()});

client.subscribe('topic-name', { qos: 2 });
client.on('message', (topic, message) => {
  console.log(message.toString());
});