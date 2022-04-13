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

let jwt;
try {
  jwt = JSON.parse(
    fs.readFileSync(path.join(__dirname, "smart-home-key.json")).toString()
  );
} catch (e) {}

const app = smarthome({
  jwt,
});

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
  if (!userExists) {
    throw new Error(
      `User  has not created an account, so there are no devices`
    );
  }
  return user;
}

app.onSync(async (body, headers) => {
  const user = await getUserIdOrThrow(headers);
  console.log(user);
  await firestore.setHomegraphEnable(userId, true);

  const devices = await firestore.getDevices(userId);
  const syncResponse = {
    requestId: body.requestId,
    payload: {
      agentUserId: userId,
      devices,
    },
  };
  console.log("SyncResponse:", syncResponse);
  return syncResponse;
});

app.onQuery(async (body, headers) => {
  console.log("QueryRequest:", body);
  const userId = await getUserIdOrThrow(headers);
  const deviceStates = {};
  const { devices } = body.inputs[0].payload;
  await asyncForEach(devices, async (device) => {
    try {
      const states = await firestore.getState(userId, device.id);
      deviceStates[device.id] = {
        ...states,
        status: "SUCCESS",
      };
    } catch (e) {
      console.log("error getting device state:", e);
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
  console.log("QueryResponse:", queryResponse);
  return queryResponse;
});

app.onExecute(async (body, headers) => {
  console.log("ExecuteRequest:", body);
  const userId = await getUserIdOrThrow(headers);
  const commands = [];

  const { devices, execution } = body.inputs[0].payload.commands[0];
  await asyncForEach(devices, async (device) => {
    try {
      const states = await firestore.execute(userId, device.id, execution[0]);
      commands.push({
        ids: [device.id],
        status: "SUCCESS",
        states,
      });
      try {
        const reportStateRequest = {
          agentUserId: userId,
          requestId: Math.random().toString(),
          payload: {
            devices: {
              states: {
                [device.id]: states,
              },
            },
          },
        };
        console.log("RequestStateRequest:", reportStateRequest);
        const reportStateResponse = JSON.parse(
          await app.reportState(reportStateRequest)
        );
        console.log("ReportStateResponse:", reportStateResponse);
      } catch (e) {
        const errorResponse = JSON.parse(e);
        console.log(
          "error reporting device state to homegraph:",
          errorResponse
        );
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
  console.log("ExecuteResponse:", executeResponse);
  return executeResponse;
});

app.onDisconnect(async (body, headers) => {
  console.log("DisconnectRequest:", body);
  const userId = await getUserIdOrThrow(headers);
  await firestore.disconnect(userId);
  const disconnectResponse = {};
  console.log("DisconnectResponse:", disconnectResponse);
  return disconnectResponse;
});

module.exports = app;
