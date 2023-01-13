const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const itemTable = "momentos-items";

const get = async (id) => {
  if (!!id) {
    const params = {
      TableName: itemTable,
      Key: {
        id: Number(id),
      },
    };
    return await dynamodb
      .get(params)
      .promise()
      .then(
        (response) => {
          // console.log({ response });
          return util.buildResponse(200, response.Item);
        },
        (error) => {
          console.error("Error getting items: ", error);
        }
      );
  } else {
    const params = {
      TableName: itemTable,
    };
    return await dynamodb
      .scan(params)
      .promise()
      .then(
        (response) => {
          return util.buildResponse(200, response);
        },
        (error) => {
          console.error("Error getting items: ", error);
        }
      );
  }
};

const post = async (itemInfo) => {
  const id = itemInfo.id || Date.now();
  const ownerid = itemInfo.ownerid;
  const image = itemInfo.image;
  const description = itemInfo.description;

  if (!ownerid || !image || !description) {
    return util.buildResponse(401, {
      message: "These fields are required (ownerid, image, description).",
    });
  }

  const dynamoItem = await getItem(id);
  if (dynamoItem) {
    return util.buildResponse(401, {
      message: "This item ID has already been taken.",
    });
  }

  const item = {
    id: id,
    ownerid: ownerid,
    image: image,
    description: description,
    likes: 0,
    fires: 0,
    claps: 0,
    laughs: 0,
  };

  const putItemResponse = await putItem(item);
  if (!putItemResponse) {
    return util.buildResponse(503, { message: "Server error!" });
  }

  const response = {
    item: item,
  };
  return util.buildResponse(200, response);
};

const react = async (itemInfo) => {
  const id = itemInfo.id;
  const reaction = itemInfo.reaction;
  const active = itemInfo.active;

  if (!id || reaction === null || active === null) {
    return util.buildResponse(401, {
      message: "These fields are required (id, reaction, active).",
    });
  }

  const item = await getItem(id);

  switch (reaction) {
    case 0:
      item.likes += !!active ? 1 : -1;
      break;
    case 1:
      item.fires += !!active ? 1 : -1;
      break;
    case 2:
      item.claps += !!active ? 1 : -1;
      break;
    case 3:
      item.laughs += !!active ? 1 : -1;
      break;
    default:
      break;
  }

  const putItemResponse = await putItem(item);
  if (!putItemResponse) {
    return util.buildResponse(503, { message: "Server error!" });
  }

  const response = {
    item: item,
  };
  return util.buildResponse(200, response);
};

const getItem = async (id) => {
  const params = {
    TableName: itemTable,
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
        console.error("Error getting item: ", error);
      }
    );
};

const putItem = async (item) => {
  const params = {
    TableName: itemTable,
    Item: item,
  };
  return await dynamodb
    .put(params)
    .promise()
    .then(
      () => {
        return true;
      },
      (error) => {
        console.error("Error putting item: ", error);
      }
    );
};

module.exports.get = get;
module.exports.post = post;
module.exports.react = react;
