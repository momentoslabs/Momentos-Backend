const signupService = require("./services/signup");
const signinService = require("./services/signin");
const usersService = require("./services/users");
const verifyService = require("./services/verify");
const util = require("./utils/util");

const healthPath = "/health";
const signupPath = "/signup";
const signinPath = "/signin";
const usersPath = "/users";
const verifyPath = "/verify";

exports.handler = async (event) => {
  // console.log("Request Event: ", event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = util.buildResponse(200);
      break;
    case event.httpMethod === "POST" && event.path === signupPath:
      const signupBody = JSON.parse(event.body);
      response = await signupService.signup(signupBody);
      break;
    case event.httpMethod === "POST" && event.path === signinPath:
      const signinBody = JSON.parse(event.body);
      response = await signinService.signin(signinBody);
      break;
    case event.httpMethod === "GET" && event.path.slice(0, 6) === usersPath:
      response = await usersService.get(
        event.path.slice(7),
        !isNaN(Number(event.path.slice(7)))
      );
      break;
    case event.httpMethod === "POST" && event.path.slice(0, 6) === usersPath:
      const usersPostBody = JSON.parse(event.body);
      response = await usersService.post(usersPostBody, event.path.slice(7));
      break;
    case event.httpMethod === "POST" && event.path === verifyPath:
      const verifyBody = JSON.parse(event.body);
      response = await verifyService.verify(verifyBody);
      break;
    default:
      response = util.buildResponse(404, "404 not found");
  }
  return response;
};
