const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
});
const util = require("../utils/util");
const bcrypt = require("bcryptjs");
const auth = require("../utils/auth");
const randomColor = require("randomcolor");
const randomEmoji = require("random-unicode-emoji");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const userTable = "momentos-users";

const signup = async (userInfo) => {
  const id = userInfo.id || Date.now();
  const username = userInfo.username;
  const name = userInfo.name;
  const email = userInfo.email;
  const password = userInfo.password;
  const dob = userInfo.dob;
  const color = randomColor();
  const emoji = randomEmoji.random({ count: 1 })[0];
  const connections = [];
  const requested = [];
  const items = [];

  if (!username || !name || !email || !password) {
    return util.buildResponse(401, {
      message: "All fields are required.",
    });
  }

  const dynamoUser = await getUser(username.toLowerCase().trim());
  if (dynamoUser && dynamoUser.username) {
    return util.buildResponse(401, {
      message: "This username has already been taken.",
    });
  }

  const encryptedPassword = bcrypt.hashSync(password.trim(), 10);
  const user = {
    id: id,
    username: username.toLowerCase().trim(),
    name: name,
    email: email,
    password: encryptedPassword,
    dob: dob,
    color: color,
    emoji: emoji,
    connections: connections,
    requested: requested,
    items: items,
  };

  const putUserResponse = await putUser(user);
  if (!putUserResponse) {
    return util.buildResponse(503, { message: "Server error!" });
  }

  const token = auth.generateToken({
    username: username,
    name: name,
  });

  const response = {
    user: {
      id: id,
      username: username,
      name: name,
      email: email,
      dob: dob,
      color: color,
      emoji: emoji,
      connections: connections,
      requested: requested,
      items: items,
    },
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

module.exports.signup = signup;
