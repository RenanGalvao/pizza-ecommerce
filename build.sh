#!/bin/bash

## Create https cert
cd https && openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pen -out cert.pen -batch

## Create a copy of config_sample.js
cd .. && cp config_sample.js config.js