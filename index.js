const aedes = require("aedes")();
const server = require("net").createServer(aedes.handle);
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { connectionString } = require("./config.json");
var cors = require("cors");

const mqttMiddleware = require("./src/middlewares/mqtt.middleware");
const mqttAuth = require("./src/middlewares/mqtt.middleware");
const mqttEvents = require("./src/events/mqtt.events");
const authRoutes = require("./src/routes/authentication.routes");
const sectionRoutes = require("./src/routes/section.routes");
const deviceRoutes = require("./src/routes/devices.routes");
const errorHandler = require("./src/middlewares/error.middleware");

const port = 1883;
const app = express();

//listening to different events
aedes.on("subscribe", mqttEvents.subscribe);
aedes.on("ack", mqttEvents.ack);
aedes.on("clientDisconnect", mqttEvents.disconnet);

//authentication middleware to verify the token and validate the connection requests
aedes.authenticate = mqttAuth.mqttAuth;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
// app.use(errorHandler);

/* adding routes to express application */
app.use("/auth", authRoutes);
app.use("/device", deviceRoutes);
app.use("/section", sectionRoutes);

app.listen(8085, () => {
  console.log("http server started on port 8080");
});

server.listen(port, () => {
  console.log("server started and listening on port ", port);
  connectMongo();
});

const connectMongo = () => {
  const connectionOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  };
  console.log("connecting database....");
  mongoose
    .connect(process.env.MONGODB_URI || connectionString, connectionOptions)
    .then((d) => {
      console.log("database connected");
    })
    .catch((e) => {
      console.log(e);
    });
};

exports.Aedes = aedes;
