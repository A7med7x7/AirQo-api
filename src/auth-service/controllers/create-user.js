const httpStatus = require("http-status");
const { logText, logObject } = require("@utils/log");
const createUserUtil = require("@utils/create-user");
const { extractErrorsFromRequest, HttpError } = require("@utils/errors");
const isEmpty = require("is-empty");
const controlAccessUtil = require("@utils/control-access");
const constants = require("@config/constants");
const log4js = require("log4js");
const UserModel = require("@models/User");
const logger = log4js.getLogger(
  `${constants.ENVIRONMENT} -- create-user-controller`
);

const createUser = {
  listStatistics: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      logText(".....................................");
      logText("list all users by query params provided");
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }

      const responseFromListStatistics = await createUserUtil.listStatistics(
        tenant
      );

      if (responseFromListStatistics.success === true) {
        return res.status(httpStatus.OK).json({
          success: true,
          message: responseFromListStatistics.message,
          users_stats: responseFromListStatistics.data,
        });
      } else if (responseFromListStatistics.success === false) {
        const status = responseFromListStatistics.status
          ? responseFromListStatistics.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromListStatistics.message,
          errors: {
            message: responseFromListStatistics.errors
              ? responseFromListStatistics.errors
              : { message: "Internal Server Error" },
          },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  listLogs: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      logText(".....................................");
      logText("list all users by query params provided");
      let { tenant, id } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }

      let request = Object.assign({}, req);
      request.query.tenant = tenant;
      const responseFromListStatistics = await createUserUtil.listLogs(request);

      if (responseFromListStatistics.success === true) {
        return res.status(httpStatus.OK).json({
          success: true,
          message: responseFromListStatistics.message,
          users_stats: responseFromListStatistics.data,
        });
      } else if (responseFromListStatistics.success === false) {
        const status = responseFromListStatistics.status
          ? responseFromListStatistics.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromListStatistics.message,
          errors: responseFromListStatistics.errors
            ? responseFromListStatistics.errors
            : { message: "Internal Server Errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  listCache: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      logText(".....................................");
      logText("list all users by query params provided");
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }
      let request = Object.assign({}, req);
      request.query.tenant = tenant;

      const responseFromListUsers = await createUserUtil.listCache(request);

      if (responseFromListUsers.success === true) {
        const status = responseFromListUsers.status
          ? responseFromListUsers.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromListUsers.message,
          users: responseFromListUsers.data,
        });
      } else if (responseFromListUsers.success === false) {
        const status = responseFromListUsers.status
          ? responseFromListUsers.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromListUsers.message,
          errors: responseFromListUsers.errors
            ? responseFromListUsers.errors
            : { message: "Internal Server Errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  list: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      logText(".....................................");
      logText("list all users by query params provided");
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }
      let request = Object.assign({}, req);
      request.query.tenant = tenant;

      const responseFromListUsers = await createUserUtil.list(request);

      if (responseFromListUsers.success === true) {
        const status = responseFromListUsers.status
          ? responseFromListUsers.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromListUsers.message,
          users: responseFromListUsers.data,
        });
      } else if (responseFromListUsers.success === false) {
        const status = responseFromListUsers.status
          ? responseFromListUsers.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromListUsers.message,
          errors: responseFromListUsers.errors
            ? responseFromListUsers.errors
            : { message: "Internal Server Errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  listUsersAndAccessRequests: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      logText(".....................................");
      logText("list all users by query params provided");

      let request = Object.assign({}, req);

      if (isEmpty(request.query.tenant)) {
        request.query.tenant = constants.DEFAULT_TENANT;
      }

      const responseFromListUsersAndAccessRequests =
        await createUserUtil.listUsersAndAccessRequests(request);

      logObject(
        "responseFromListUsersAndAccessRequests",
        responseFromListUsersAndAccessRequests
      );

      if (responseFromListUsersAndAccessRequests.success === true) {
        const status = responseFromListUsersAndAccessRequests.status
          ? responseFromListUsersAndAccessRequests.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromListUsersAndAccessRequests.message,
          users: responseFromListUsersAndAccessRequests.data,
        });
      } else if (responseFromListUsersAndAccessRequests.success === false) {
        const status = responseFromListUsersAndAccessRequests.status
          ? responseFromListUsersAndAccessRequests.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromListUsersAndAccessRequests.message,
          errors: responseFromListUsersAndAccessRequests.errors
            ? responseFromListUsersAndAccessRequests.errors
            : { message: "Internal Server Errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  googleCallback: async (req, res) => {
    try {
      logObject("req.user.toAuthJSON()", req.user.toAuthJSON());
      const token = req.user.toAuthJSON().token;
      // Set the token as an HTTP-only cookie
      res.cookie("access_token", token, {
        httpOnly: true,
        secure: true, // Enable if using HTTPS
      });

      res.redirect(`${constants.GMAIL_VERIFICATION_SUCCESS_REDIRECT}`);

      /***
       * in the FRONTEND, access the cookie:
       * ==================================
       * npm install js-cookie
       * import Cookies from "js-cookie";
       * const token = Cookies.get("access_token");
       */
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  verify: async (req, res) => {
    try {
      logText("..................................");
      logText("user verify......");
      res.status(httpStatus.OK).send("this token is valid");
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  verifyEmail: async (req, res) => {
    try {
      const { query, body } = req;
      let { tenant } = query;
      logText("we are verifying the email.....");
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let request = req;
      if (isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const responseFromVerifyEmail = await controlAccessUtil.verifyEmail(
        request
      );

      logObject("responseFromVerifyEmail", responseFromVerifyEmail);

      if (responseFromVerifyEmail.success === true) {
        const status = responseFromVerifyEmail.status
          ? responseFromVerifyEmail.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: "email verified sucessfully",
        });
      } else if (responseFromVerifyEmail.success === false) {
        const status = responseFromVerifyEmail.status
          ? responseFromVerifyEmail.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromVerifyEmail.message,
          errors: responseFromVerifyEmail.errors
            ? responseFromVerifyEmail.errors
            : { message: "internal server errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  deleteMobileUserData: async (req, res) => {
    try {
      logText("We are deleting the app data.....");

      let request = Object.assign({}, req);

      const responseFromDeleteAppData =
        await createUserUtil.deleteMobileUserData(request);

      logObject("responseFromDeleteAppData", responseFromDeleteAppData);

      if (responseFromDeleteAppData.success === true) {
        const status = responseFromDeleteAppData.status
          ? responseFromDeleteAppData.status
          : httpStatus.OK;
        res.status(status).json({
          success: true,
          message: "Data deleted sucessfully",
        });
      } else if (responseFromDeleteAppData.success === false) {
        const status = responseFromDeleteAppData.status
          ? responseFromDeleteAppData.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromDeleteAppData.message,
          errors: responseFromDeleteAppData.errors
            ? responseFromDeleteAppData.errors
            : { message: "internal server errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  emailReport: async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .json({ errors: [{ msg: "No PDF or CSV file attached" }] });
      }

      const pdfFile = req.files.pdf;
      if (pdfFile && !pdfFile.mimetype.includes("pdf")) {
        return res.status(400).json({ errors: [{ msg: "Invalid PDF file" }] });
      }

      const csvFile = req.files.csv;
      if (csvFile && !csvFile.mimetype.includes("csv")) {
        return res.status(400).json({ errors: [{ msg: "Invalid CSV file" }] });
      }

      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      let request = Object.assign({}, req);
      let { tenant } = req.query;
      if (!isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const responseFromEmailReport = await createUserUtil.emailReport(request);

      logObject("responseFromEmailReport", responseFromEmailReport);

      if (responseFromEmailReport.success === true) {
        const status = responseFromEmailReport.status
          ? responseFromEmailReport.status
          : httpStatus.OK;
        res.status(status).json({
          success: true,
          message: "Report Emailed sucessfully",
        });
      } else if (responseFromEmailReport.success === false) {
        const status = responseFromEmailReport.status
          ? responseFromEmailReport.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromEmailReport.message,
          errors: responseFromEmailReport.errors
            ? responseFromEmailReport.errors
            : { message: "internal server errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  lookUpFirebaseUser: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      let request = Object.assign({}, req);
      let { tenant } = req.query;
      if (!isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const result = await createUserUtil.lookUpFirebaseUser(request);
      if (result[0].success === true) {
        const status = result[0].status ? result[0].status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: result[0].message,
          user: result[0].data,
          exists: true,
          status: "exists",
        });
      } else if (result[0].success === false) {
        const status = result[0].status
          ? result[0].status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: "User does not exist",
          exists: false,
          errors: result[0].errors
            ? result[0].errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  syncAnalyticsAndMobile: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      if (isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const result = await createUserUtil.syncAnalyticsAndMobile(request);
      if (result.success === true) {
        const status = result.status ? result.status : httpStatus.OK;
        return res.status(status).json(result);
      } else if (result.success === false) {
        const status = result.status
          ? result.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: "Unable to sync Analytics and Mobile Accounts",
          exists: false,
          errors: result.errors
            ? result.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  signUpWithFirebase: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      if (isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const result = await createUserUtil.signUpWithFirebase(request);
      if (result.success === true) {
        const status = result.status ? result.status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: result.message,
          user: result.data,
          exists: true,
          status: "exists",
        });
      } else if (result.success === false) {
        const status = result.status
          ? result.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: "Unable to signup with Firebase",
          exists: false,
          errors: result.errors
            ? result.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  loginWithFirebase: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      if (isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const result = await createUserUtil.loginWithFirebase(request);
      logObject("result", result);

      if (result.success === true) {
        const status = result.status ? result.status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: result.message,
          ...result.data,
        });
      } else if (result.success === false) {
        const status = result.status
          ? result.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        const errors = result.errors
          ? result.errors
          : { message: "Internal Server Error" };

        return res.status(status).json({
          success: false,
          message: "Unable to login with Firebase",
          exists: false,
          errors,
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  verifyFirebaseCustomToken: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      if (isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const result = await createUserUtil.verifyFirebaseCustomToken(request);
      logObject("the result from the verify request", result);
      if (result.success === true) {
        const status = result.status ? result.status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: result.message,
          ...result.data,
        });
      } else if (result.success === false) {
        const status = result.status
          ? result.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: "Unable to login with Firebase",
          exists: false,
          errors: result.errors
            ? result.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  createFirebaseUser: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      logText("createFirebaseUser controller......");

      let request = Object.assign({}, req);

      const result = await createUserUtil.createFirebaseUser(request);
      logObject("result", result[0]);
      if (result[0].success === true) {
        const status = result[0].status ? result[0].status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: result[0].message,
          user: result[0].data[0],
          exists: true,
          status: "exists",
        });
      } else if (result[0].success === false) {
        logText("we are falsing here..");
        const status = result[0].status
          ? result[0].status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: result[0].message,
          errors: result[0].errors
            ? result[0].errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  sendFeedback: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      const request = Object.assign({}, req);

      const responseFromSendEmail = await createUserUtil.sendFeedback(request);

      if (responseFromSendEmail.success === true) {
        const status = responseFromSendEmail.status
          ? responseFromSendEmail.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: "successfully responded to email",
          status,
        });
      } else if (responseFromSendEmail.success === false) {
        const status = responseFromSendEmail.status
          ? responseFromSendEmail.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        const errors = responseFromSendEmail.errors
          ? responseFromSendEmail.errors
          : { message: "Internal Server Error" };

        return res.status(status).json({
          success: true,
          message: responseFromSendEmail.message,
          status,
          errors,
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  forgot: async (req, res) => {
    logText("...........................................");
    logText("forgot password...");
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }

      let request = Object.assign({}, req);
      request.query.tenant = tenant;
      const responseFromForgotPassword = await createUserUtil.forgotPassword(
        request
      );
      logObject("responseFromForgotPassword", responseFromForgotPassword);
      if (responseFromForgotPassword.success === true) {
        const status = responseFromForgotPassword.status
          ? responseFromForgotPassword.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromForgotPassword.message,
          response: responseFromForgotPassword.data,
        });
      } else if (responseFromForgotPassword.success === false) {
        const status = responseFromForgotPassword.status
          ? responseFromForgotPassword.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromForgotPassword.message,
          error: responseFromForgotPassword.error
            ? responseFromForgotPassword.error
            : "",
          errors: responseFromForgotPassword.errors
            ? responseFromForgotPassword.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  register: async (req, res) => {
    logText("..................................................");
    logText("register user.............");
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT || "airqo";
      }

      let request = Object.assign({}, req);
      request["query"]["tenant"] = tenant.toLowerCase();

      let responseFromCreateUser = await createUserUtil.register(request);
      logObject("responseFromCreateUser in controller", responseFromCreateUser);
      if (responseFromCreateUser.success === true) {
        const status = responseFromCreateUser.status
          ? responseFromCreateUser.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromCreateUser.message,
          user: responseFromCreateUser.data,
        });
      } else if (responseFromCreateUser.success === false) {
        const status = responseFromCreateUser.status
          ? responseFromCreateUser.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromCreateUser.message,
          errors: responseFromCreateUser.errors
            ? responseFromCreateUser.errors
            : { message: "Internal Server Errors" },
          error: responseFromCreateUser.error
            ? responseFromCreateUser.error
            : "Internal Server Errors",
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  create: async (req, res) => {
    logText("..................................................");
    logText("create user.............");
    try {
      const { query } = req;
      let { tenant } = query;
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }

      let request = req.body;
      request.tenant = tenant.toLowerCase();

      const responseFromCreateUser = await createUserUtil.create(request);
      logObject("responseFromCreateUser in controller", responseFromCreateUser);
      if (responseFromCreateUser.success === true) {
        const status = responseFromCreateUser.status
          ? responseFromCreateUser.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromCreateUser.message,
          user: responseFromCreateUser.data,
        });
      } else if (responseFromCreateUser.success === false) {
        const status = responseFromCreateUser.status
          ? responseFromCreateUser.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromCreateUser.message,
          errors: responseFromCreateUser.errors
            ? responseFromCreateUser.errors
            : { message: "Internal Server Errors" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  login: async (req, res) => {
    logText("..................................");
    logText("user login......");
    try {
      let { tenant } = req.query;
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      if (isEmpty(tenant)) {
        tenant = "airqo";
      }

      if (!isEmpty(tenant) && tenant !== "airqo") {
        logObject("tenant", tenant);
        return res.status(httpStatus.MOVED_PERMANENTLY).json({
          message:
            "The account has been moved permanently to a new location, please reach out to: info@airqo.net",
          location: "https://platform.airqo.net/",
          errors: {
            message:
              "The account has been moved permanently to a new location, please reach out to: info@airqo.net",
            location: "https://platform.airqo.net/",
          },
        });
      }

      logObject("req,auth", req.auth);

      if (req.auth.success === true) {
        // logObject("req.user", req.user);
        logObject("req.user.toAuthJSON()", await req.user.toAuthJSON());
        const user = await req.user.toAuthJSON();
        const currentDate = new Date();
        await UserModel("airqo").findByIdAndUpdate(user._id, {
          lastLogin: currentDate,
          isActive: true,
        });

        return res.status(httpStatus.OK).json(user);
      } else {
        if (req.auth.error) {
          throw new HttpError(req.auth.message, httpStatus.BAD_REQUEST);
          // throw new Error(req.auth.message);
          // return res.status(httpStatus.BAD_REQUEST).json({
          //   success: req.auth.success,
          //   error: req.auth.error,
          //   message: req.auth.message,
          // });
        }
        throw new HttpError(req.auth.message, httpStatus.BAD_REQUEST);
        // throw new Error(req.auth.message);
        // return res.status(httpStatus.BAD_REQUEST).json({
        //   success: req.auth.success,
        //   message: req.auth.message,
        // });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  logout: async (req, res) => {
    logText("..................................");
    logText("user logout......");
    try {
      res
        .status(httpStatus.NOT_IMPLEMENTED)
        .json({ success: false, message: "not yet implemented" });
      req.logout((err) => {
        if (err) {
          logObject("err,err");
          logger.error(`Error during logout: ${JSON.stringify(err)}`);
          return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            message: "Internal Server Error",
            errors: { message: "Error during logout" },
            success: false,
          });
        }
        return res
          .status(httpStatus.OK)
          .json({ message: "logout successful", success: true });
        // res.redirect("https://analytics.airqo.net/account/login");
      });
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },

  guest: (req, res) => {
    logText("..................................");
    logText("user guest login......");
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      req.session.guest = true;
      req.session.save((err) => {
        if (err) {
          return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ success: false, message: "Error creating guest session" });
        }
        // Return the guest id to the client
        return res
          .status(httpStatus.OK)
          .json({ success: true, guestId: req.user.guestId });
      });
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  delete: async (req, res) => {
    try {
      logText(".................................................");
      logText("inside delete user............");
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT || "airqo";
      }
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      let request = Object.assign({}, req);
      request.query.tenant = tenant;

      const responseFromRemoveUser = await createUserUtil.delete(request);

      if (responseFromRemoveUser.success === true) {
        const status = responseFromRemoveUser.status
          ? responseFromRemoveUser.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromRemoveUser.message
            ? responseFromRemoveUser.message
            : "",
          user: responseFromRemoveUser.data,
        });
      } else if (responseFromRemoveUser.success === false) {
        const status = responseFromRemoveUser.status
          ? responseFromRemoveUser.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromRemoveUser.message
            ? responseFromRemoveUser.message
            : "",
          error: responseFromRemoveUser.error
            ? responseFromRemoveUser.error
            : "Internal Server Error",
          errors: responseFromRemoveUser.errors
            ? responseFromRemoveUser.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  update: async (req, res) => {
    try {
      logText(".................................................");
      logText("inside user update................");
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT || "airqo";
      }
      let request = Object.assign({}, req);
      request["query"]["tenant"] = tenant;
      let responseFromUpdateUser = await createUserUtil.update(request);
      logObject("responseFromUpdateUser", responseFromUpdateUser);
      if (responseFromUpdateUser.success === true) {
        const status = responseFromUpdateUser.status
          ? responseFromUpdateUser.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromUpdateUser.message,
          user: responseFromUpdateUser.data,
        });
      } else if (responseFromUpdateUser.success === false) {
        const status = responseFromUpdateUser.status
          ? responseFromUpdateUser.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: responseFromUpdateUser.message,
          errors: responseFromUpdateUser.errors
            ? responseFromUpdateUser.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  loginInViaEmail: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      request["query"]["purpose"] = "login";
      if (!isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const value = await createUserUtil.generateSignInWithEmailLink(request);
      if (value.success === true) {
        const status = value.status ? value.status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: value.message,
          login_link: value.data.link,
          token: value.data.token,
          email: value.data.email,
          emailLinkCode: value.data.emailLinkCode,
        });
      } else if (value.success === false) {
        const status = value.status
          ? value.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: value.message,
          errors: value.errors
            ? value.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  emailAuth: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      const { body, query, params } = req;
      let { tenant } = req.query;
      let request = Object.assign({}, req);
      request["query"]["purpose"] = "auth";
      if (params.purpose) {
        request["query"]["purpose"] = params.purpose;
      }
      if (!isEmpty(tenant)) {
        request.query.tenant = "airqo";
      }

      const value = await createUserUtil.generateSignInWithEmailLink(request);
      if (value.success === true) {
        const status = value.status ? value.status : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: value.message,
          token: value.data.token,
          auth_link: value.data.link,
          auth_code: value.data.emailLinkCode,
          email: value.data.email,
        });
      } else if (value.success === false) {
        const status = value.status
          ? value.status
          : httpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
          success: false,
          message: value.message,
          errors: value.errors
            ? value.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  updateForgottenPassword: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }

      let request = Object.assign({}, req);
      request["query"]["tenant"] = tenant;
      const responseFromUpdateForgottenPassword =
        await createUserUtil.updateForgottenPassword(request);

      if (responseFromUpdateForgottenPassword.success === true) {
        const status = responseFromUpdateForgottenPassword.status
          ? responseFromUpdateForgottenPassword.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: "successfully updated the password",
          user: responseFromUpdateForgottenPassword.data,
        });
      } else if (responseFromUpdateForgottenPassword.success === false) {
        const status = responseFromUpdateForgottenPassword.status
          ? responseFromUpdateForgottenPassword.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromUpdateForgottenPassword.message,
          errors: responseFromUpdateForgottenPassword.errors
            ? responseFromUpdateForgottenPassword.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  updateKnownPassword: async (req, res) => {
    try {
      logText("update known password............");
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }

      let { tenant } = req.query;
      if (isEmpty(tenant)) {
        tenant = constants.DEFAULT_TENANT;
      }

      let request = Object.assign({}, req);
      request.query.tenant = tenant;

      const responseFromUpdatePassword =
        await createUserUtil.updateKnownPassword(request);

      if (responseFromUpdatePassword.success === true) {
        const status = responseFromUpdatePassword.status
          ? responseFromUpdatePassword.status
          : httpStatus.OK;
        return res.status(status).json({
          success: true,
          message: responseFromUpdatePassword.message,
          user: responseFromUpdatePassword.data,
        });
      } else if (responseFromUpdatePassword.success === false) {
        const status = responseFromUpdatePassword.status
          ? responseFromUpdatePassword.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        return res.status(status).json({
          success: false,
          message: responseFromUpdatePassword.message,
          errors: responseFromUpdatePassword.errors
            ? responseFromUpdatePassword.errors
            : { message: "Internal Server Error" },
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
  subscribeToNewsLetter: async (req, res) => {
    try {
      const errors = extractErrorsFromRequest(req);
      if (errors) {
        throw new HttpError(
          "bad request errors",
          httpStatus.BAD_REQUEST,
          extractErrorsFromRequest(req)
        );
      }
      let request = {};
      request["body"] = req.body;
      if (isEmpty(req.body.tags)) {
        request["body"]["tags"] = [];
      }
      const responseFromSubscribeToNewsLetter =
        await createUserUtil.subscribeToNewsLetter(request);

      if (responseFromSubscribeToNewsLetter.success === true) {
        const status = responseFromSubscribeToNewsLetter.status
          ? responseFromSubscribeToNewsLetter.status
          : httpStatus.OK;
        return res.status(status).json({
          message: responseFromSubscribeToNewsLetter.message,
          success: true,
        });
      } else if (responseFromSubscribeToNewsLetter.success === false) {
        const status = responseFromSubscribeToNewsLetter.status
          ? responseFromSubscribeToNewsLetter.status
          : httpStatus.INTERNAL_SERVER_ERROR;

        const errors = responseFromSubscribeToNewsLetter.errors
          ? responseFromSubscribeToNewsLetter.errors
          : { message: "Internal Server Errors" };

        return res.status(status).json({
          success: false,
          message: responseFromSubscribeToNewsLetter.message,
          errors,
        });
      }
    } catch (error) {
      logger.error(`Internal Server Error ${error.message}`);
      throw new HttpError(
        "Internal Server Error",
        httpStatus.INTERNAL_SERVER_ERROR,
        { message: error.message }
      );
    }
  },
};

module.exports = createUser;
