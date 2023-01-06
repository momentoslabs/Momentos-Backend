const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const bcrypt = require("bcryptjs");
const auth = require("../utils/auth");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "momentos-users";

const signin = async (user) => {
  const username = user.username;
  const password = user.password;
  if (!user || !username || !password) {
    return util.buildResponse(401, {
      message: "Please enter a valid username and password.",
    });
  }

  const dynamoUser = await getUser(username);
  if (!dynamoUser.username) {
    return util.buildResponse(403, { message: "Invalid username." });
  }

  if (!bcrypt.compareSync(password, dynamoUser.password)) {
    return util.buildResponse(403, { message: "Invalid password." });
  }

  const userInfo = {
    id: dynamoUser.id,
    username: dynamoUser.username,
    name: dynamoUser.name,
    email: dynamoUser.email,
    color: dynamoUser.color,
    emoji: dynamoUser.emoji,
    connections: dynamoUser.connections,
    requested: dynamoUser.requested,
    items: dynamoUser.items,
  };

  const token = auth.generateToken(userInfo);
  const response = {
    user: userInfo,
    token: token,
  };
  return util.buildResponse(200, response);
};

const getUser = async (username) => {
  const params = {
    TableName: userTable,
    IndexName: "username-index",
    KeyConditionExpression: "username = :username",
    ExpressionAttributeValues: {
      ":username": username,
    },
  };
  try {
    const data = await dynamodb.query(params).promise();
    return data.Items[0];
  } catch (error) {
    return error;
  }
};

module.exports.signin = signin;
