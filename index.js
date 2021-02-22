import server from './lib/server.js';

let app = {};

app.init = () => {
  server.init();
};

app.init();