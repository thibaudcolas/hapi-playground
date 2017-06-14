const Hapi = require('hapi');
const Inert = require('inert');
const Good = require('good');

const PORT = process.env.PORT || 5000;

const server = new Hapi.Server();
server.connection({ port: PORT });

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
  handler(request, reply) {
    reply(`Hello, ${encodeURIComponent(request.params.name)}!`);
  },
});

server.register(Inert, (err) => {
  if (err) {
    throw err;
  }

  server.route({
    method: 'GET',
    path: '/hello',
    handler(request, reply) {
      reply.file('./public/hello.html');
    },
  });
});

server.register(
  {
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
  },
  (err) => {
    if (err) {
      throw err; // something bad happened loading the plugin
    }

    server.start((err) => {
      if (err) {
        throw err;
      }

      server.log('info', `Server running at: ${server.info.uri}`);
    });
  },
);

