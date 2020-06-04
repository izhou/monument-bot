const fs = require("fs");
const PATH = `${__dirname}/.data/anon-poll.txt`;
let concerned_users = {};

exports.readAnonPollData = () => {
  return fs.readFile(PATH, "utf-8", (error, data) => {
    concerned_users = JSON.parse(data);
  });
};

const updateConcernedUsers = (message_ts, users) => {

  concerned_users[message_ts] = users;

  fs.writeFile(PATH, JSON.stringify(concerned_users), e => {
    console.log(JSON.stringify(concerned_users));
  });
}

exports.getConcernedUsers = message_ts => {
  return concerned_users[message_ts] || [];
};

exports.addConcernedUser = (message_ts, user_id) => {
  var users = concerned_users[message_ts] || [];
  if (!users.includes(user_id)) users.push(user_id);

  updateConcernedUsers(message_ts, users);
  
  return users;
};

exports.removeConcernedUser = (message_ts, user_id) => {
  var users = concerned_users[message_ts] || [];
  users = users.filter(function(value) {
    return value !== user_id;
  });

  updateConcernedUsers(message_ts, users);

  return users;
};

exports.userIsConcerned = (message_ts, user_id) => {
  return (
    concerned_users[message_ts] && concerned_users[message_ts].includes(user_id)
  );
};
