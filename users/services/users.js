const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const bcrypt = require("bcryptjs");
const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "momentos-users";

const get = async (key, usingId) => {
  if (!!key) {
    if (usingId) {
      const params = {
        TableName: userTable,
        Key: {
          id: Number(key),
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
            console.error("Error getting user: ", error);
          }
        );
    } else {
      const params = {
        TableName: userTable,
        IndexName: "username-index",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": key,
        },
      };
      try {
        const data = await dynamodb.query(params).promise();
        return util.buildResponse(200, data.Items[0]);
      } catch (error) {
        return error;
      }
    }
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
  const dob = userInfo.dob;
  const color = userInfo.color;
  const emoji = userInfo.emoji;
  const connections = userInfo.connections;
  const items = userInfo.items;
  const lastactive = userInfo.lastactive;
  const lastpost = userInfo.lastpost;

  const dynamoUser = await getUser(userId, true);

  const encryptedPassword = !!password
    ? bcrypt.hashSync(password.trim(), 10)
    : null;

  let newConnections = dynamoUser.connections;
  if (!!connections) {
    if (connections.action === 0) {
      delete newConnections[connections.id];
    } else if (connections.action === 1) {
      newConnections[connections.id] = false;
    } else if (connections.action === 2) {
      newConnections[connections.id] = true;
    }
  }

  const user = {
    id: dynamoUser.id,
    name: !!name ? name : dynamoUser.name,
    email: !!email ? email.toLowerCase().trim() : dynamoUser.email,
    username: !!username ? username.toLowerCase().trim() : dynamoUser.username,
    password: !!password ? encryptedPassword : dynamoUser.password,
    dob: !!dob ? dob : dynamoUser.dob,
    color: !!color ? color.toLowerCase().trim() : dynamoUser.color,
    emoji: !!emoji ? emoji.toLowerCase().trim() : dynamoUser.emoji,
    connections: !!connections ? newConnections : dynamoUser.connections,
    items: !!items ? [...dynamoUser.items, items] : dynamoUser.items,
    lastactive: !!lastactive ? lastactive : dynamoUser.lastactive,
    lastthree: !!lastpost
      ? [lastpost, ...dynamoUser.lastthree.slice(0, 2)]
      : dynamoUser.lastthree,
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

const getUser = async (key, usingId) => {
  if (usingId) {
    const params = {
      TableName: userTable,
      Key: {
        id: Number(key),
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
  } else {
    const params = {
      TableName: userTable,
      IndexName: "username-index",
      KeyConditionExpression: "username = :username",
      ExpressionAttributeValues: {
        ":username": key,
      },
    };
    try {
      const data = await dynamodb.query(params).promise();
      return data.Items[0];
    } catch (error) {
      return error;
    }
  }
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
