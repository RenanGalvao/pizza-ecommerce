/*
* Login Handler
*/
import _data from '../../data.js';
import { validate, invalidFields, hash, generateCookieHeader, createTokens } from '../../helpers.js';
import config from '../../../config.js';
import { debuglog, formatWithOptions } from 'util';

// Setting debug name for the file
const debug = debuglog('login');

export default {

  // Required data: email, password
  // Optional data: none
  async post(request) {
    debug(formatWithOptions({colors: true}, '[LOGIN] Request: %O', request));
  
    const email = validate(request.payload.email, 'email');
    const password = validate(request.payload.password, 'string');
    debug(formatWithOptions({colors: true}, '[LOGIN] Validation: %O', {email, password}));

    if(!email || !password){
      const invalid = invalidFields({email, password}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `Missing or invalid required fields: ${invalid}.`}, contentType: 'application/json'};
    }

    // Lookup the user data
    const errObj = {status: 404, payload: {err: 'Bad Request', message: 'User doesn\'t exist.'}, contentType: 'application/json'};
    const userData = await _data.read('users', email, errObj);

    // Compare passwords
    if(userData.hashedPassword != hash(password)){
      return {status: 400, payload: {err: 'Bad Request', message: 'Wrong password.'}, contentType: 'application/json'};
    }

    // Create tokens
    const tokenIdLength = config.token.tokenIdLength;
    const accessTokenMaxAge = config.token.accessTokenMaxAge;
    const refreshTokenMaxAge = config.token.refreshTokenMaxAge;

    const [accessToken, refreshToken] = await createTokens(userData, tokenIdLength, accessTokenMaxAge, refreshTokenMaxAge);
      
    debug(formatWithOptions({colors: true}, '[LOGIN] Access Token: %O\nRefresh Token: %O', accessToken, refreshToken));
    return {status: 200, payload: {auth: true}, headers: generateCookieHeader(accessToken, refreshToken), contentType: 'application/json'};
    
  },
}