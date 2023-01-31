const mongoose = require("mongoose").set("debug", true);
const ObjectId = mongoose.Types.ObjectId;
var uniqueValidator = require("mongoose-unique-validator");
const { logElement, logText, logObject } = require("@utils/log");
const isEmpty = require("is-empty");
const httpStatus = require("http-status");

const periodSchema = new mongoose.Schema(
  {
    value: { type: String },
    label: { type: String },
    unitValue: { type: Number },
    unit: { type: String },
  },
  { _id: false }
);

const DefaultsSchema = new mongoose.Schema(
  {
    pollutant: {
      type: String,
      trim: true,
      required: [true, "pollutant is required!"],
    },
    frequency: {
      type: String,
      required: [true, "frequency is required!"],
    },
    startDate: {
      type: Date,
      required: [true, "startDate is required!"],
    },
    endDate: {
      type: Date,
      required: [true, "endDate is required!"],
    },
    chartType: {
      type: String,
      required: [true, "chartTyoe is required!"],
    },
    chartTitle: {
      type: String,
      required: [true, "chartTitle is required!"],
    },
    chartSubTitle: {
      type: String,
      required: [true, "chartSubTitle is required!"],
    },
    airqloud: {
      type: ObjectId,
      ref: "airqloud",
    },
    network_id: {
      type: ObjectId,
      ref: "network",
      required: [true, "network_id is required!"],
    },
    user: {
      type: ObjectId,
      required: [true, "user is required"],
      ref: "user",
    },
    sites: [
      {
        type: ObjectId,
        ref: "site",
      },
    ],
    period: { type: periodSchema, required: [true, "period is required!"] },
  },
  {
    timestamps: true,
  }
);

DefaultsSchema.plugin(uniqueValidator, {
  message: `{VALUE} should be unique!`,
});

DefaultsSchema.methods = {
  toJSON() {
    return {
      _id: this._id,
      pollutant: this.pollutant,
      frequency: this.frequency,
      user: this.user,
      airqloud: this.airqloud,
      startDate: this.startDate,
      endDate: this.endDate,
      chartType: this.chartType,
      chartTitle: this.chartTitle,
      chartSubTitle: this.chartSubTitle,
      sites: this.sites,
      network_id: this.network_id,
      period: this.period,
      createdAt: this.createdAt,
    };
  },
};

DefaultsSchema.statics = {
  async register(args) {
    try {
      let body = args;
      if (body._id) {
        delete body._id;
      }
      let data = await this.create({
        ...body,
      });

      if (!isEmpty(data)) {
        return {
          success: true,
          data,
          message: "default created",
          status: httpStatus.OK,
        };
      } else {
        return {
          success: true,
          message: "default not created despite successful operation",
          status: httpStatus.CREATED,
        };
      }
    } catch (err) {
      let response = {};
      let errors = {};
      let message = "Internal Server Error";
      let status = httpStatus.INTERNAL_SERVER_ERROR;
      if (err.code === 11000 || err.code === 11001) {
        errors = err.keyValue;
        message = "duplicate values provided";
        status = httpStatus.CONFLICT;
        Object.entries(errors).forEach(([key, value]) => {
          return (response[key] = value);
        });
      } else {
        message = "validation errors for some of the provided fields";
        status = httpStatus.CONFLICT;
        errors = err.errors;
        Object.entries(errors).forEach(([key, value]) => {
          return (response[key] = value.message);
        });
      }
      return {
        errors: response,
        message,
        success: false,
        status,
      };
    }
  },
  async list({ skip = 0, limit = 20, filter = {} } = {}) {
    try {
      let defaults = await this.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();

      if (!isEmpty(defaults)) {
        let data = defaults;
        return {
          success: true,
          data,
          message: "successfully listed the defaults",
          status: httpStatus.OK,
        };
      }
      if (isEmpty(data)) {
        return {
          success: true,
          message: "no defaults found for this search",
          data,
          status: httpStatus.NOT_FOUND,
        };
      }
      return {
        success: false,
        message: "unable to retrieve defaults",
        data,
        status: httpStatus.BAD_GATEWAY,
      };
    } catch (error) {
      return {
        success: false,
        message: "unable to list the defaults",
        errors: error.message,
        status: httpStatus.CONFLICT,
      };
    }
  },
  async modify({ filter = {}, update = {} } = {}) {
    try {
      let options = { new: true };
      if (update._id) {
        delete update._id;
      }
      let updatedDefault = await this.findOneAndUpdate(
        filter,
        update,
        options
      ).exec();

      if (!isEmpty(updatedDefault)) {
        let data = updatedDefault._doc;
        return {
          success: true,
          message: "successfully modified the default",
          data,
          status: httpStatus.OK,
        };
      } else {
        return {
          success: false,
          message: "the default does not exist, please crosscheck",
          status: httpStatus.NOT_FOUND,
        };
      }
    } catch (err) {
      let errors = {};
      let message = "";
      let status = "";
      if (err.code == 11000) {
        errors = err.keyValue;
        message = "duplicate values provided";
        status = httpStatus.CONFLICT;
      }
      return {
        success: false,
        message,
        errors,
        status,
      };
    }
  },
  async remove({ filter = {} } = {}) {
    try {
      let options = {
        projection: {
          _id: 1,
          user: 1,
          chartTitle: 1,
          chartSubTitle: 1,
          airqloud: 1,
        },
      };
      let removedDefault = await this.findOneAndRemove(filter, options).exec();

      if (!isEmpty(removedDefault)) {
        let data = removedDefault._doc;
        return {
          success: true,
          message: "successfully removed the default",
          data,
          status: httpStatus.OK,
        };
      } else {
        return {
          success: false,
          message: "default does not exist, please crosscheck",
          status: httpStatus.NOT_FOUND,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "model server error",
        errors: error.message,
        status: httpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  },
};

module.exports = DefaultsSchema;
