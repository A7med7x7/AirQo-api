const httpStatus = require("http-status");
const { logObject, logElement, logText } = require("@utils/log");
const { validationResult } = require("express-validator");
const errors = require("@utils/errors");
const createHostUtil = require("@utils/create-host");
const log4js = require("log4js");
const logger = log4js.getLogger("create-host-controller");
const isEmpty = require("is-empty");

const createHost = {
  register: async (req, res) => {
    logText("registering host.............");
    try {
      const hasErrors = !validationResult(req).isEmpty();
      if (hasErrors) {
        let nestedErrors = validationResult(req).errors[0].nestedErrors;
        return errors.badRequest(
          res,
          "bad request errors",
          errors.convertErrorArrayToObject(nestedErrors)
        );
      }
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      if (isEmpty(tenant)) {
        tenant = "airqo";
      }

      let responseFromCreateHost = await createHostUtil.create(request);
      logObject("responseFromCreateHost in controller", responseFromCreateHost);
      if (responseFromCreateHost.success === true) {
        let status = responseFromCreateHost.status
          ? responseFromCreateHost.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromCreateHost.message,
          created_host: responseFromCreateHost.data,
        });
      }

      if (responseFromCreateHost.success === false) {
        let status = responseFromCreateHost.status
          ? responseFromCreateHost.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        let errors = responseFromCreateHost.errors
          ? responseFromCreateHost.errors
          : "";

        return res.status(status).json({
          success: false,
          message: responseFromCreateHost.message,
          errors,
        });
      }
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        errors: { message: error.message },
      });
    }
  },

  delete: async (req, res) => {
    try {
      logText(".................................................");
      logText("inside delete host............");
      const { tenant } = req.query;
      const hasErrors = !validationResult(req).isEmpty();
      if (hasErrors) {
        let nestedErrors = validationResult(req).errors[0].nestedErrors;
        return errors.badRequest(
          res,
          "bad request errors",
          errors.convertErrorArrayToObject(nestedErrors)
        );
      }

      let request = Object.assign({}, req);
      let responseFromRemoveHost = await createHostUtil.delete(request);

      logObject("responseFromRemoveHost", responseFromRemoveHost);

      if (responseFromRemoveHost.success === true) {
        let status = responseFromRemoveHost.status
          ? responseFromRemoveHost.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromRemoveHost.message,
          removed_host: responseFromRemoveHost.data,
        });
      }

      if (responseFromRemoveHost.success === false) {
        const status = responseFromRemoveHost.status
          ? responseFromRemoveHost.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromRemoveHost.message,
          errors: responseFromRemoveHost.errors
            ? responseFromRemoveHost.errors
            : "Internal Server Error",
        });
      }
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        errors: { message: error.message },
      });
    }
  },

  update: async (req, res) => {
    try {
      logText("updating host................");
      const hasErrors = !validationResult(req).isEmpty();
      if (hasErrors) {
        let nestedErrors = validationResult(req).errors[0].nestedErrors;
        return errors.badRequest(
          res,
          "bad request errors",
          errors.convertErrorArrayToObject(nestedErrors)
        );
      }
      let request = Object.assign({}, req);
      let responseFromUpdateHost = await createHostUtil.update(request);
      logObject("responseFromUpdateHost", responseFromUpdateHost);
      if (responseFromUpdateHost.success === true) {
        const status = responseFromUpdateHost.status
          ? responseFromUpdateHost.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromUpdateHost.message,
          updated_host: responseFromUpdateHost.data,
        });
      } else if (responseFromUpdateHost.success === false) {
        const status = responseFromUpdateHost.status
          ? responseFromUpdateHost.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromUpdateHost.message,
          errors: responseFromUpdateHost.errors
            ? responseFromUpdateHost.errors
            : "Internal Server Error",
        });
      }
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        errors: { message: error.message },
      });
    }
  },

  list: async (req, res) => {
    try {
      logText(".....................................");
      logText("list all hosts by query params provided");
      const hasErrors = !validationResult(req).isEmpty();
      if (hasErrors) {
        let nestedErrors = validationResult(req).errors[0].nestedErrors;
        return errors.badRequest(
          res,
          "bad request errors",
          errors.convertErrorArrayToObject(nestedErrors)
        );
      }
      let request = Object.assign({}, req);

      let responseFromListHosts = await createHostUtil.list(request);
      logElement(
        "has the response for listing hosts been successful?",
        responseFromListHosts.success
      );
      if (responseFromListHosts.success === true) {
        let status = responseFromListHosts.status
          ? responseFromListHosts.status
          : httpStatus.OK;
        res.status(status).json({
          success: true,
          message: responseFromListHosts.message,
          hosts: responseFromListHosts.data,
        });
      }

      if (responseFromListHosts.success === false) {
        let errors = responseFromListHosts.errors
          ? responseFromListHosts.errors
          : "";
        let status = responseFromListHosts.status
          ? responseFromListHosts.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        res.status(status).json({
          success: false,
          message: responseFromListHosts.message,
          errors,
        });
      }
    } catch (error) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        errors: { message: error.message },
      });
    }
  },
};

module.exports = createHost;
