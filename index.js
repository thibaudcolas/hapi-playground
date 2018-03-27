const Hapi = require("hapi");
const Basic = require("hapi-auth-basic");
const Inert = require("inert");
const Good = require("good");

require("dotenv").config();

const auth = require("./lib/auth");

const PORT = process.env.PORT || 5000;

const server = new Hapi.Server();
server.connection({ port: PORT });

// Name of the cookie, and config.
server.state("test_data", {
  ttl: null,
  isSecure: true,
  isHttpOnly: true,
  encoding: "base64json",
  clearInvalid: false, // remove invalid cookies
  strictHeader: true, // don't allow violations of RFC 6265
});

const logPlugin = {
  register: Good,
  options: {
    reporters: {
      console: [
        {
          module: "good-squeeze",
          name: "Squeeze",
          args: [
            {
              response: "*",
              log: "*",
            },
          ],
        },
        {
          module: "good-console",
        },
        "stdout",
      ],
    },
  },
};

server.register([Inert, logPlugin, Basic], (err) => {
  // Something bad happened loading the plugins.
  if (err) {
    throw err;
  }

  // Create a strategy with the name of simple that refers to our scheme named basic. We also pass an options object that gets passed to the scheme and allows us to configure its behavior.
  // We could have also used mode, first optional parameter, and may be either true, false, 'required', 'optional', or 'try'.
  // The default mode is false, which means that the strategy will be registered but not applied anywhere until you do so manually.
  server.auth.strategy("simple", "basic", {
    validateFunc: auth.validate,
  });

  server.route({
    // The method parameter can be any valid HTTP method, array of HTTP methods, or an asterisk to allow any method.
    method: "GET",
    //  The path parameter defines the path including parameters. It can contain optional parameters, numbered parameters, and even wildcards.
    path: "/",
    handler(request, reply) {
      reply("Hello, world!").state("test_data", { firstVisit: false });
    },
    config: {
      cache: {
        expiresIn: 30 * 1000,
        // private means it should not be cached by intermediate caches.
        privacy: "private",
      },
    },
  });

  server.route({
    method: "GET",
    path: "/{name}/{ttl?}",
    config: {
      // Explicitly enable auth per-route, defining which strategy to use.
      // If enabled by default, can also be disabled per-route with auth: false.
      auth: "simple",
      handler(request, reply) {
        const response = reply(
          `Hello, ${encodeURIComponent(request.params.name)}, ${
            request.auth.credentials.name
          }!`,
        );

        if (request.params.ttl) {
          // Overrides config.cache.expiresIn
          response.ttl(parseFloat(request.params.ttl));
        }
      },
    },
  });

  server.route({
    method: "GET",
    path: "/hello",
    handler(request, reply) {
      reply.file("./public/hello.html");
    },
  });

  // Multi-segment parameters ?!
  server.route({
    method: "GET",
    path: "/hello/{user*2}",
    handler(request, reply) {
      const userParts = request.params.user.split("/");
      reply(
        `hello ${encodeURIComponent(userParts[0])} ${encodeURIComponent(
          userParts[1],
        )}!`,
      );
    },
  });

  server.start((err) => {
    if (err) {
      throw err;
    }

    server.log("info", `Server running at: ${server.info.uri}`);
  });
});
