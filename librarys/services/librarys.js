const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const libraryTable = "momentos-librarys";

const get = async (id) => {
  if (!!id) {
    const params = {
      TableName: libraryTable,
      Key: {
        id: Number(id),
      },
    };
    return await dynamodb
      .get(params)
      .promise()
      .then(
        (response) => {
          console.log({ response });
          return util.buildResponse(200, response.Item);
        },
        (error) => {
          console.error("Error getting librarys: ", error);
        }
      );
  } else {
    const params = {
      TableName: libraryTable,
    };
    return await dynamodb
      .scan(params)
      .promise()
      .then(
        (response) => {
          return util.buildResponse(200, response);
        },
        (error) => {
          console.error("Error getting librarys: ", error);
        }
      );
  }
};

const post = async (libraryInfo) => {
  const id = libraryInfo.id;
  const postid = libraryInfo.postid;
  const reactions = libraryInfo.reactions;

  if (!id || !postid || reactions === null) {
    return util.buildResponse(401, {
      message: "These fields are required (id, postid, reaction).",
    });
  }

  const library = (await getLibrary(id)) ?? { id: id };
  library[postid] = { reactions: reactions };

  const putLibraryResponse = await putLibrary(library);
  if (!putLibraryResponse) {
    return util.buildResponse(503, { message: "Server error!" });
  }

  const response = {
    library: library,
  };
  return util.buildResponse(200, response);
};

const getLibrary = async (id) => {
  const params = {
    TableName: libraryTable,
    Key: {
      id: id,
    },
  };

  return await dynamodb
    .get(params)
    .promise()
    .then(
      (response) => {
        return response.Item;
      },
      (error) => {
        console.error("Error getting library: ", error);
      }
    );
};

const putLibrary = async (library) => {
  const params = {
    TableName: libraryTable,
    Item: library,
  };
  return await dynamodb
    .put(params)
    .promise()
    .then(
      () => {
        return true;
      },
      (error) => {
        console.error("Error putting library: ", error);
      }
    );
};

module.exports.get = get;
module.exports.post = post;
