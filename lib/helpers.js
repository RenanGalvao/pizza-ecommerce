/*
* Small functions that help the app
*/
import crypto from 'crypto';
import https from 'https';
import { StringDecoder } from 'string_decoder';
import queryString from 'querystring';
import { debuglog, formatWithOptions } from 'util';
import fs from 'fs';
import path from 'path';
import config from '../config.js';
import _data from './data.js';

// Setting debug name for the file
const debug = debuglog('helpers');

let helpers = {};


// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try{
    return JSON.parse(str);
  }catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = str => {
  if(typeof(str) == 'string' && str.length > 0){
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  }else{
    return false;
  }
};

// Create a random string for the token
helpers.createRandomString = strLength => {
  // Validation
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;

  if(strLength){
    const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let str = '';
    for(let i = 0; i < strLength; i++){
      // Get a random character from the possibleChars
      let randomChar = possibleChars.charAt(Math.trunc(Math.random() * possibleChars.length));
      str += randomChar;
    }

    return str;
  }else{
    return false;
  }
};

// Returns which fields are invalid
// obj = { fieldName: fieldValue, ... }
helpers.invalidFields = obj => {
  const invalidFields = [];

  for(const [key, value] of Object.entries(obj)){
    if(!value){
      invalidFields.push(key);
    }
  };

  return invalidFields;
};

// Filter items from a list based on key:value
// searchObj = {key1: value1, key2: value2...}
helpers.filterList = async (list, dir, searchObj) => {
  debug(formatWithOptions({colors: true}, '[HELPERS][FILTER_LIST][INPUT] List: %O\nDirectory: %O\nSearch Object: %O', list, dir, searchObj));
  let items = [];

  for(let i = 0; i < list.length; i++){
    try{
      let item = await _data.read(dir, list[i]);

      for(const key in searchObj){
        const regex = new RegExp(searchObj[key], 'gi');

        if(String(item[key]).match(regex) != null){
          items.push(item);
          break;
        }
      }
    }catch(err){
      debug(formatWithOptions({colors: true}, '[HELPERS][FILTER_LIST][ERROR] Error: %O', err));
      return false;
    }
  }

  return items;
};

/* 
* Validates input
*/
helpers.validate = (input, expectedType, {min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, equal = 0, enumArr = [], integer = false} = {}) => {
  debug(formatWithOptions({colors: true}, '[HELPERS][VALIDATE][INPUT] Input: %O\nExpected Type: %O\nMin: %O\nMax: %O\nEnum Array:', input, expectedType, min, max, enumArr));

  switch(expectedType){
    case 'string':
      if(min != Number.MIN_SAFE_INTEGER || max != Number.MAX_SAFE_INTEGER){
        return typeof input == 'string' && input.trim().length >= min && input.trim().length <= max ? input.trim() : false;
      }else if(equal != 0){
        return typeof input == 'string' && input.trim().length == equal ? input.trim() : false;
      }else{
        return typeof input == 'string' && input.trim().length > 0 ? input.trim() : false;
      }
    case 'number':
      let tmp = typeof input == 'number' && input >= min && input <= max ? input : false;
      if(tmp){
        // Only exclusive when integer == true
        tmp = !integer ? tmp : tmp % 1 == 0 ? tmp : false;
      }
      return tmp;
    case 'boolean':
      return typeof input == 'boolean' ? input : undefined;
    case 'email':
      const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
      return typeof input == 'string' && input.trim().length > 0 && emailRegex.test(input.trim()) ? input.trim() : false;
    case 'enum':
      return typeof input == 'string' && input.trim().length > 0 && enumArr.includes(input.trim()) ? input.trim() : false;
    case 'token':
      return typeof input == 'string' && input.trim().length == equal ? input.trim() : false;
    case 'array':
      return typeof input == 'object' && input instanceof Array && input.length > 0 ? input : false;  
      default:
      return false;
  }
};

// Safe floating point number
helpers.safeFloatNumber = (float, digits = 2) => {
  return Number(Math.fround(float).toFixed(digits));
}

// Make an https request
helpers.httpsRequest = (data, options) => {

  // No validation, call this the right way
  // Inside a Promise to retrieve the data
  // No reject, chech for status and payload
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const decoder = new StringDecoder('utf-8');
      let buffer = '';
  
      res.on('data', data => buffer += decoder.write(data));
  
      res.on('end', () => {
        buffer += decoder.end();
        resolve(helpers.parseJsonToObject(buffer));
      });
    });
  
    req.on('error', (e) => {
      debug(formatWithOptions({colors: true}, '[HELPERS][HTTPS_REQUEST] Error: %O', e));
      resolve(e);
    });
  
    // Make the request
    req.write(data);
    req.end();
  })
}

// Download all html contenct from given url
helpers.getHTMLfromURL = (url) => {
  // No reject, won't break the code
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.setEncoding('utf-8');
      let rawData = '';

      res.on('data', chunk => { rawData += chunk});
      res.on('end', () => {
        resolve(rawData);
      });
    })
    .on('error', err => {
      debug(formatWithOptions({colors: true}, '[HELPERS][GET_HTML_FROM_URL] Error: %O', e));
      resolve(err);
    });
  });
}

// Stringify nested objects
// One level
helpers.stringify = obj => {
  let string = '';
  
  for(const key in obj){
    // its an object, not an array
    if(typeof obj[key] == 'object' && !Array.isArray(obj[key])){
      for(const k in obj[key]){
        string += `${key}[${k}]=${queryString.escape(obj[key][k])}&`;
      }
    }else{
      string += `${key}=${queryString.escape(obj[key])}&`;
    }
  }

  return string;
};

/*
* Handle all errors from routes
*/
helpers.errorHandler = (err = {}) => {
  debug(formatWithOptions({colors: true}, '[HELPERS][ERROR_HANDLER] Object: %O', err));

  if(typeof err.status != 'undefined' && typeof err.payload != 'undefined'){
    return err;
  }else if(typeof err.status != 'undefined'){
    return {status: err.status, payload: {}, contentType: 'application/json'};
  }else{
    // Last resort, default res
    return {status: 500, payload: {err: 'Internal', message: 'We\'re working on it :('}, contentType: 'application/json'}; 
  }
};

/*
* Retrieve HTML templates
*/
helpers.getTemplate = async (dir, templateName, data = {}, headerName = '_header', footerName = '_footer', custom_err = {}) => {
  debug(formatWithOptions({colors: true}, '[HELPERS][GET_TEMPLATE] Dir: %O\nTemplate Name: %O\n Custom ERR: %O', dir, templateName, custom_err));
  const templateBaseDir = path.join(path.resolve('lib'), '..', 'templates');
  let headerTemplate = '';
  let footerTemplate = '';
  
  return new Promise((resolve, reject) => {
    if(headerName != ''){
      try{
        headerTemplate = helpers.interpolate(fs.readFileSync(path.join(templateBaseDir, `${headerName}.html`), 'utf-8'), data);
      }catch(err){
        debug(formatWithOptions({colors: true}, '[HELPERS][GET_TEMPLATE] Error: %O', err));
        reject(custom_err);
      }
    }

    if(footerName != ''){
      try{
        footerTemplate = helpers.interpolate(fs.readFileSync(path.join(templateBaseDir, `${footerName}.html`), 'utf-8'), data);
      }catch(err){
        debug(formatWithOptions({colors: true}, '[HELPERS][GET_TEMPLATE] Error: %O', err));
        reject(custom_err);
      }
    }

    fs.readFile(path.join(templateBaseDir, dir, `${templateName}.html`), 'utf-8', (err, html) => {
      if(!err && html){
        debug(formatWithOptions({colors: true}, '[HELPERS][GET_TEMPLATE] Response: %O', html));
        resolve(`${headerTemplate}${interpolate(html, data)}${footerTemplate}`);
      }else{
        debug(formatWithOptions({colors: true}, '[HELPERS][GET_TEMPLATE] Error: %O', err));
        reject(custom_err);
      }
    });
  });
}

/*
* Take a given string and a data object, find/replace all the keys within it
*/
helpers.interpolate = (str, data) => {
  // Add globals to data
  for(const key in config.templateGlobals){
    data[`global.${key}`] = config.templateGlobals[key];
  }

  // Add data to str
  for(const key in data){
    const replace = data[key];
    const find = new RegExp(`{${key}}`, 'g');
    str = str.replace(find, replace); 
  }

  return str
};

/*
* Retrieve static assets from public folder
*/
helpers.getStaticAsset = (pathToFile, custom_err = {}) => {
  debug(formatWithOptions({colors: true}, '[HELPERS][GET_STATIC_ASSET] Path To File: %O\nCustom ERR: %O', pathToFile, custom_err));
  
  return new Promise((resolve, reject) => {
    const publicBaseDir = path.join(path.resolve('lib'), '..', 'public');
    const fileExtension = pathToFile.lastIndexOf('.') > 0 ? pathToFile.substring(pathToFile.lastIndexOf('.') + 1) : false;

    if(!fileExtension){
      reject(custom_err)
    }
    
    // decodeURI to remove %20 and other things from URI
    fs.readFile(decodeURI(path.join(publicBaseDir, pathToFile)), (err, file) => {
      if(!err && file){
        debug(formatWithOptions({colors: true}, '[HELPERS][GET_STATIC_ASSET] Response: %O', file));
        resolve([file, helpers.getContentType(fileExtension)]);
      }else{
        debug(formatWithOptions({colors: true}, '[HELPERS][GET_STATIC_ASSET] Error: %O', err));
        reject(custom_err);
      }
    })
  });
};

/*
* Determine the Content type of a given file (default to plain text)
*/
helpers.getContentType = ext => {
  switch(ext){
    case 'css':
      return 'text/css';
    case 'gif':
      return 'image/gif';
    case 'ico':
      return 'image/x-icon';
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'js':
      return 'application/javascript';
    case 'png':
      return 'image/png';
    case 'pdf':
      return 'application/pdf';
    case 'rar': 
      return 'application/x-rar-compressed';
    case 'svg':
      return 'image/svg+xml';
    case 'webm':
      return 'video/webm';
    case 'zip':
      return 'application/zip';
    default:
      return 'application/octet-stream';
  }
};

/*
* Cookies
*/
helpers.generateCookieHeader = (access_token, refresh_token) => {
  debug(formatWithOptions({colors: true}, '[HELPERS][GENERATE_COOKIE_HEADER] Access Token: %O\nRefresh Token: %O', access_token, refresh_token));
  
  return {
    'Set-Cookie': [
      `access_token=${access_token.id}; Max-Age=${access_token.maxAge}; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV == 'production' ? 'Secure' : ''};`,
      `refresh_token=${refresh_token.id}; Max-Age=${refresh_token.maxAge}; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV == 'production' ? 'Secure' : ''};`  
    ]
  }
};

// Destroy both access and refresh tokens
helpers.deleteCookieHeader = () => {
  return {
    'Set-Cookie': [
      `access_token=no_id; Max-Age=-1; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV == 'production' ? 'Secure' : ''};`,
      `refresh_token=no_id; Max-Age=-1; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV == 'production' ? 'Secure' : ''};`
    ]
  }
};

/*
* Create and Save tokens
*/
helpers.createTokens = async (userData, tokenIdLength, accessTokenMaxAge, refreshTokenMaxAge) => {
  const access_token = {
    id: createRandomString(tokenIdLength),
    name: userData.name,
    email: userData.email,
    stripe_customer_id: userData.stripe_customer_id,
    maxAge: accessTokenMaxAge,
  };
  const refresh_token = {
    id: createRandomString(tokenIdLength),
    name: userData.name,
    email: userData.email,
    stripe_customer_id: userData.stripe_customer_id,
    maxAge: refreshTokenMaxAge,
  };

  // Save
  await _data.create('tokens', access_token.id, access_token);
  await _data.create('tokens', refresh_token.id, refresh_token);

  return [access_token, refresh_token];
};

export default helpers;
export const {
  parseJsonToObject,
  hash,
  createRandomString,
  invalidFields,
  filterList,
  validate,
  safeFloatNumber,
  httpsRequest,
  stringify,
  getHTMLfromURL,
  errorHandler,
  getTemplate,
  interpolate,
  getStaticAsset,
  getContentType,
  generateCookieHeader,
  deleteCookieHeader,
  createTokens, 
} = helpers;