const Hapi = require('hapi');
const Basic = require('hapi-auth-basic');
const Inert = require('inert');
const Good = require('good');

const auth = require('./lib/auth');

const PORT = process.env.PORT || 5000;

const server = new Hapi.Server();
server.connection({ port: PORT });

const logPlugin = {
  register: Good,
  options: {
    reporters: {
      console: [
        {
          module: 'good-squeeze',
          name: 'Squeeze',
          args: [
            {
              response: '*',
              log: '*',
            },
          ],
        },
        {
          module: 'good-console',
        },
        'stdout',
      ],
    },
  },
};

server.register([
  Inert,
  logPlugin,
  Basic,
], (err) => {
  // Something bad happened loading the plugins.
  if (err) {
    throw err;
  }

  server.auth.strategy('simple', 'basic', { validateFunc: auth.validate });

  server.route({
    // The method parameter can be any valid HTTP method, array of HTTP methods, or an asterisk to allow any method.
    method: 'GET',
    //  The path parameter defines the path including parameters. It can contain optional parameters, numbered parameters, and even wildcards.
    path: '/',
    handler(request, reply) {
      reply('Hello, world!');
    },
  });

  server.route({
    method: 'GET',
    path: '/{name}',
    config: {
      auth: 'simple',
      handler(request, reply) {
        reply(`Hello, ${encodeURIComponent(request.params.name)}, ${request.auth.credentials.name}!`);
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/hello',
    handler(request, reply) {
      reply.file('./public/hello.html');
    },
  });

  server.start((err) => {
    if (err) {
      throw err;
    }

    server.log('info', `Server running at: ${server.info.uri}`);
  });
});

