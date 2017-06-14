const Bcrypt = require('bcrypt');

const { users } = require('./db');

const validate = (request, username, password, callback) => {
  const user = users[username];

  if (!user) {
    return callback(null, false);
  }

  Bcrypt.compare(password, user.password, (err, isValid) => {
    callback(err, isValid, { id: user.id, name: user.name });
  });
};

module.exports = {
  validate,
};
