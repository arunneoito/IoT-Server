const Logs = require("../models/logs.model");

async function createLog(logData) {
  const log = await Logs.create(logData);
  return log;
}

module.exports = {
  createLog,
};
