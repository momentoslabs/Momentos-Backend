const itemsService = require("./services/items");
const util = require("./utils/util");

const healthPath = "/health";
const itemsPath = "/items";
const reactionsPath = "/reactions";

exports.handler = async (event) => {
  console.log("Request Event: ", event);
  let response;
  switch (true) {
    case event.httpMethod === "GET" && event.path === healthPath:
      response = util.buildResponse(200);
      break;
    case event.httpMethod === "GET" && event.path.slice(0, 6) === itemsPath:
      response = await itemsService.get(event.path.slice(7));
      break;
    case event.httpMethod === "POST" && event.path === itemsPath:
      const itemsPostBody = JSON.parse(event.body);
      response = await itemsService.post(itemsPostBody);
      break;
    case event.httpMethod === "POST" && event.path === reactionsPath:
      const itemsReactionBody = JSON.parse(event.body);
      response = await itemsService.react(itemsReactionBody);
      break;
    default:
      response = util.buildResponse(404, "404 not found");
  }
  return response;
};
