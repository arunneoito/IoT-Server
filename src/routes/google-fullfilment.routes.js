/* Copyright 2020, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * https://developers.google.com/assistant/smarthome/develop/process-intents
 */
const fs = require("fs");
const path = require("path");

const { smarthome } = require("actions-on-google");
const accountService = require("../services/authentication.service");
const deviceService = require("../services/device.service");
const homeGraphService = require("../services/home-graph.service");

// Acquire an auth client, and bind it to all future calls

let jwt;
try {
  jwt = JSON.parse(
    fs.readFileSync(path.join(__dirname, "smart-home-key.json")).toString()
  );
} catch (e) {}

const app = smarthome({});

// Array could be of any type
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function getUserIdOrThrow(headers) {
  if (!headers["authorization"].split(" ")[1]) {
    throw new Error(
      `User  has not created an account, so there are no devices`
    );
  }

  const user = await accountService.getUserByJwt(
    headers["authorization"].split(" ")[1]
  );
  if (!user) {
    throw new Error(
      `User  has not created an account, so there are no devices`
    );
  }
  return user;
}

function parseHomeGraphDevice(devices) {
  const hgDevices = [];
  devices.forEach((element) => {
    element.channels.forEach((channel, i) => {
      hgDevices.push({
        id: channel.id,
        type: "action.devices.types.OUTLET",
        traits: ["action.devices.traits.OnOff"],
        name: {
          defaultNames: ["neo-switch-1"],
          name: channel.name,
          nicknames: [channel.name],
        },
        willReportState: false,
        roomHint: "Main Room",
        deviceInfo: {
          manufacturer: "Neoito",
          model: "neo-switch-p4",
          hwVersion: "1.0",
          swVersion: "1.0",
        },
        otherDeviceIds: [
          {
            deviceId: element.id,
          },
        ],
        customData: {
          deviceId: element.id,
        },
      });
    });
  });
  return hgDevices;
}

app.onSync(async (body, headers) => {
  console.log("sync command received");
  const user = await getUserIdOrThrow(headers);
  await accountService.update(user.id, { homeGraphEnabled: true });
  const userDevices = await deviceService.getUserDevices({
    user: { account: user },
  });
  const devices = parseHomeGraphDevice(userDevices);
  const syncResponse = {
    requestId: body.requestId,
    payload: {
      agentUserId: user.id,
      devices,
    },
  };

  return syncResponse;
});

app.onQuery(async (body, headers) => {
  console.log("query received");
  const user = await getUserIdOrThrow(headers);
  const deviceStates = {};
  const { devices } = body.inputs[0].payload;
  // console.log(devices);
  await asyncForEach(devices, async (device) => {
    try {
      const state = await deviceService.findById(device.customData.deviceId);
      if (!state) {
        throw new Error("Invalid device id !");
      }
      const channel = state.channels.find((chn) => chn.id === device.id);
      deviceStates[device.id] = {
        on: channel.value == "true",
        online: state.connected,
        status: "SUCCESS",
      };
    } catch (e) {
      // console.log("error getting device state:", e);
      deviceStates[device.id] = {
        status: "ERROR",
        errorCode: "deviceOffline",
      };
    }
  });
  const queryResponse = {
    requestId: body.requestId,
    payload: {
      devices: deviceStates,
    },
  };
  // console.log("QueryResponse:", queryResponse);
  return queryResponse;
});

app.onExecute(async (body, headers) => {
  // console.log("ExecuteRequest:", body);
  console.log("execute received");
  const user = await getUserIdOrThrow(headers);
  const commands = [];

  const { devices, execution } = body.inputs[0].payload.commands[0];
  await asyncForEach(devices, async (device) => {
    try {
      const update = await deviceService.updateChannel(
        device.customData.deviceId,
        device.id,
        execution[0].params.on
      );
      commands.push({
        ids: [device.id],
        status: "SUCCESS",
        states: {
          on: execution[0].params.on,
          online: true,
        },
      });
      try {
        const reportStateRequest = {
          agentUserId: user.id,
          requestId: body.requestId,
          payload: {
            devices: {
              states: {
                [device.id]: {
                  on: execution[0].params.on,
                  online: true,
                },
              },
            },
          },
        };
        console.log("RequestStateRequest:", reportStateRequest);
        homeGraphService.reportState(reportStateRequest);
      } catch (e) {
        // console.log("error reporting device state to homegraph:", e);
      }
    } catch (e) {
      console.log(
        "error returned by execution on firestore device document",
        e
      );
      if (e.message === "pinNeeded") {
        commands.push({
          ids: [device.id],
          status: "ERROR",
          errorCode: "challengeNeeded",
          challengeNeeded: {
            type: "pinNeeded",
          },
        });
      } else if (e.message === "challengeFailedPinNeeded") {
        commands.push({
          ids: [device.id],
          status: "ERROR",
          errorCode: "challengeNeeded",
          challengeNeeded: {
            type: "challengeFailedPinNeeded",
          },
        });
      } else if (e.message === "ackNeeded") {
        commands.push({
          ids: [device.id],
          status: "ERROR",
          errorCode: "challengeNeeded",
          challengeNeeded: {
            type: "ackNeeded",
          },
        });
      } else if (e.message === "PENDING") {
        commands.push({
          ids: [device.id],
          status: "PENDING",
        });
      } else {
        commands.push({
          ids: [device.id],
          status: "ERROR",
          errorCode: e.message,
        });
      }
    }
  });
  const executeResponse = {
    requestId: body.requestId,
    payload: {
      commands,
    },
  };

  return executeResponse;
});

app.onDisconnect(async (body, headers) => {
  const user = await getUserIdOrThrow(headers);
  await accountService.update(user.id, { homeGraphEnabled: false });
  const disconnectResponse = {};
  // console.log("DisconnectResponse:", disconnectResponse);
  return disconnectResponse;
});

module.exports = app;
