require("dotenv").config();

const { DATABASE_URL } = process.env;

// http://knexjs.org/
module.exports = {
  development: {
    client: "pg",
    connection: DATABASE_URL,
  },

  production: {
    client: "pg",
    connection: `${DATABASE_URL}?ssl=true`,
  },
};
