import { execSync } from 'child_process';

// Create Https
execSync('cd https && openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pen -out cert.pen -batch');

// Create config from config_sample
execSync('cp config_sample.js config.js');