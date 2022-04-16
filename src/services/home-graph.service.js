const { google } = require("googleapis");
const { path } = require("path");
const homegraph = google.homegraph("v1");

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname + "../../../smart-home-key.json"),
  scopes: ["https://www.googleapis.com/auth/homegraph"],
});

exports.reportState = async (reportState) => {
  try {
    const authClient = await auth.getClient();
    google.options({ auth: authClient });

    await homegraph.devices.reportStateAndNotification({
      requestBody: reportState,
    });
  } catch (error) {
    console.log(error);
  }
};
