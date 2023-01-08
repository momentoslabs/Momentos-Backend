const librarysService = require("./services/librarys");
const util = require("./utils/util");

const healthPath = "/health";
const librarysPath = "/librarys";

exports.handler = async (event) => {
  // console.log("Request Event: ", event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = util.buildResponse(200);
      break;
    case event.httpMethod === "GET" && event.path.slice(0, 9) === librarysPath:
      response = await librarysService.get(event.path.slice(10));
      break;
    case event.httpMethod === "POST" && event.path === librarysPath:
      const librarysPostBody = JSON.parse(event.body);
      response = await librarysService.post(librarysPostBody);
      break;
    default:
      response = util.buildResponse(404, "404 not found");
  }
  return response;
};
