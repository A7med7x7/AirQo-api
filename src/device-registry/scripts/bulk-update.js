/**
 * For the device_codes....
 * Fetch the available and get their IDS, store them in an array.
 * 
 * Iterate over each of the IDS and
 just update all the device_codes accordingly.
 * 
 Repeat the same procedure for the site_codes...
 * 
 */

const getDevices = require("./data-devices");
const getSites = require("./data-sites");
const getActivities = require("./data-activities");
const createDeviceUtil = require("../utils/create-device");
const createSiteUtil = require("../utils/create-site");
const createActivitiesUtil = require("../utils/create-activity");
const { logObject, logElement, logText } = require("../utils/log");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const devices = getDevices();
const sites = getSites();
const activities = getActivities();
const isEmpty = require("is-empty");

/**
Ensure that you have the following data files:

scripts/data-airqlouds.js
scripts/data-sites.js
scripts/data-devices.js

Within each data file, create an array of entity objects and 
export the data as follows:

const ARRAY_OF_OBJECTS = [
  {},
  {}
]

module.exports = () => {
  return ARRAY_OF_OBJECTS;
};
 */

const runDeviceUpdates = async ({ network = "" } = {}) => {
  let count = 0;
  const length = devices.length;
  devices.forEach(async (element) => {
    let request = {};
    request["query"] = {};
    request["query"]["tenant"] = "airqo";
    request["body"] = element;
    request["body"]["network"] = network;
    let device_codes = [];

    if (!isEmpty(element.device_number)) {
      request["query"]["device_number"] = element.device_number;
      device_codes.push(element.device_number.toString());
    }
    if (!isEmpty(element._id)) {
      request["query"]["_id"] = element._id;
      device_codes.push(element._id);
    }
    if (!isEmpty(element.name)) {
      request["query"]["name"] = element.name;
      device_codes.push(element.name);
    }

    if (!isEmpty(element.site) && !isEmpty(element.site._id)) {
      request["body"]["site_id"] = ObjectId(element.site._id);
    }

    request["body"]["device_codes"] = device_codes;

    const responseFromUpdateDevice = await createDeviceUtil.updateOnPlatform(
      request
    );
    if (responseFromUpdateDevice.success === true) {
      logElement(" the successfull updated device detail", element._id);
      count += 1;
      if (length === count) {
        return {
          success: true,
          message: "operation finished",
        };
      }
    } else if (responseFromUpdateDevice.success === false) {
      logObject("failed to update Device", responseFromUpdateDevice);
      count += 1;
      if (length === count) {
        return {
          success: true,
          message: "operation finished with some errors",
        };
      }
    }
  });
};

const runSiteUpdates = async ({ network = "" } = {}) => {
  const length = sites.length;
  let count = 0;
  sites.forEach(async (element) => {
    let request = {};
    request["query"] = {};
    request["query"]["tenant"] = "airqo";
    request["body"] = element;
    request["body"]["network"] = network;

    let site_codes = [];
    let airqlouds = [];
    let filter = {};

    // if (!isEmpty(element.generated_name)) {
    //   request["query"]["generated_name"] = element.generated_name;
    //   site_codes.push(element.generated_name);
    //   filter["generated_name"] = element.generated_name;
    // }
    // if (!isEmpty(element._id)) {
    //   request["query"]["_id"] = element._id;
    //   site_codes.push(element._id);
    //   filter["_id"] = ObjectId(element._id);
    // }
    // if (!isEmpty(element.name)) {
    //   request["query"]["name"] = element.name;
    //   site_codes.push(element.name);
    //   filter["name"] = element.name;
    // }
    if (!isEmpty(element.lat_long)) {
      request["query"]["lat_long"] = element.lat_long;
      site_codes.push(element.lat_long);
      filter["lat_long"] = element.lat_long;
    }

    if (!isEmpty(element.airqlouds) && Array.isArray(element.airqlouds)) {
      for (let a = 0; a < element.airqlouds.length; a++) {
        airqlouds.push(ObjectId(element.airqlouds[a]._id));
      }
    }

    request["body"]["site_codes"] = site_codes;
    request["body"]["airqlouds"] = airqlouds;
    let update = request.body;

    const responseFromUpdateSite = await createSiteUtil.update(
      "airqo",
      filter,
      update
    );
    if (responseFromUpdateSite.success === true) {
      logElement("the site detail", element._id);
      count += 1;
      if (length === count) {
        return {
          success: true,
          message: "operation finished",
        };
      }
    } else if (responseFromUpdateSite.success === false) {
      logObject("failed to update Site", responseFromUpdateSite);
      count += 1;
      if (length === count) {
        return {
          success: true,
          message: "operation finished with some errors",
        };
      }
    }
  });
};

const runActivitiesUpdates = async ({ network = "" } = {}) => {
  try {
    const length = activities.length;
    let successfulCount = 0;
    let unsuccessfulCount = 0;
    let message = "";

    for (let count = 0; count < length; count++) {
      let request = {};
      request["query"] = {};
      request["query"]["tenant"] = "airqo";
      request["body"] = activities[count];
      request["body"]["network"] = network;
      let activity_codes = [];

      if (!isEmpty(activities[count]._id)) {
        request["query"]["_id"] = activities[count]._id;
        activity_codes.push(activities[count]._id);
      }

      request["body"]["activity_codes"] = activity_codes;

      logObject("request", request);

      const responseFromUpdateActivity = await createActivitiesUtil.update(
        request
      );

      if (responseFromUpdateActivity.success === true) {
        logText("yeah");
        successfulCount += 1;
      } else if (responseFromUpdateActivity.success === false) {
        logText("nah");
        unsuccessfulCount += 1;
      }
    }

    if (!isEmpty(unsuccessfulCount)) {
      message = "operation successfully finished but with some internal errors";
    } else {
      message = "entire operation finished successfully";
    }
    logElement("unsuccessfulCount", unsuccessfulCount);
    logElement("successfulCount", successfulCount);

    if (unsuccessfulCount + successfulCount === length) {
      return {
        success: true,
        message,
        data: { unsuccessfulCount, successfulCount },
      };
    } else {
      return {
        success: true,
        message,
        data: { unsuccessfulCount, successfulCount },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "internal server error",
      errors: { message: error.message },
    };
  }
};

module.exports = { runSiteUpdates, runDeviceUpdates, runActivitiesUpdates };
