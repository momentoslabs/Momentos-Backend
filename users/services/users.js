const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const bcrypt = require("bcryptjs");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "momentos-users";

const get = async (username) => {
  if (!!username) {
    const params = {
      TableName: userTable,
      Key: {
        username: username,
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
          console.error("Error getting users: ", error);
        }
      );
  } else {
    const params = {
      TableName: userTable,
    };
    return await dynamodb
      .scan(params)
      .promise()
      .then(
        (response) => {
          return util.buildResponse(200, response);
        },
        (error) => {
          console.error("Error getting users: ", error);
        }
      );
  }
};

const post = async (userInfo, userId) => {
  const username = userInfo.username;
  const name = userInfo.name;
  const email = userInfo.email;
  const password = userInfo.password;
  const color = userInfo.color;
  const emoji = userInfo.emoji;
  const connections = userInfo.connections;
  const items = userInfo.items;

  const dynamoUser = await getUser(username);

  const encryptedPassword = !!password
    ? bcrypt.hashSync(password.trim(), 10)
    : null;

  const user = {
    id: dynamoUser.id,
    name: !!name ? name : dynamoUser.name,
    email: !!email ? email.toLowerCase().trim() : dynamoUser.email,
    username: !!username ? username.toLowerCase().trim() : dynamoUser.username,
    password: !!password ? encryptedPassword : dynamoUser.password,
    color: !!color ? color.toLowerCase().trim() : dynamoUser.color,
    emoji: !!emoji ? emoji.toLowerCase().trim() : dynamoUser.emoji,
    connections: !!connections
      ? [...dynamoUser.connections, connections]
      : dynamoUser.connections,
    items: !!items ? [...dynamoUser.items, items] : dynamoUser.items,
  };

  const putUserResponse = await putUser(user);
  if (!putUserResponse) {
    return util.buildResponse(503, { message: "Server error!" });
  }

  const response = {
    user: user,
  };
  return util.buildResponse(200, response);
};

const getUser = async (username) => {
  const params = {
    TableName: userTable,
    Key: {
      username: username,
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
        console.error("Error getting user: ", error);
      }
    );
};

const putUser = async (user) => {
  const params = {
    TableName: userTable,
    Item: user,
  };
  return await dynamodb
    .put(params)
    .promise()
    .then(
      () => {
        return true;
      },
      (error) => {
        console.error("Error putting user: ", error);
      }
    );
};

module.exports.get = get;
module.exports.post = post;