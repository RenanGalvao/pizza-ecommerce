/*
* Users Handler
*/
import _data from '../../data.js';
import { invalidFields, validate, hash, httpsRequest, stringify, deleteCookieHeader } from '../../helpers.js';
import { debuglog, formatWithOptions } from 'util';
import config from '../../../config.js';

// Setting debug name for the file
const debug = debuglog('users');


export default {

  // Required data: none, use token
  // Optional data: none
  async get(request){
    debug(formatWithOptions({colors: true}, '[USERS][GET] Request: %O', request));

    const user = await _data.read('users', request.token.email);
    delete user.hashedPassword;

    debug(formatWithOptions({colors: true}, '[USERS][SHOW] Response: %O', user));
    return {status: 200, payload: user, contentType: 'application/json'};
  },

  // Required data: name, email, street_address, password
  // Optional data: none
  async post(request){
    debug(formatWithOptions({colors: true}, '[USERS][POST] Request: %O', request));
    
    // Validate
    const name = validate(request.payload.name, 'string');
    const email = validate(request.payload.email, 'email');
    const street_address = validate(request.payload.street_address, 'string');
    const password = validate(request.payload.password, 'string');
    debug(formatWithOptions({colors: true}, '[USERS][POST] Validation: %O', {name, email, street_address, password: hash(password)}));

    if(!name || !email || !street_address || !password){
      const invalid = invalidFields({name, email, street_address, password}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `Missing or invalid required fields: ${invalid}`}, contentType: 'application/json'};
    }

    // Do not remove this try/catch block
    try{
      // Make sure that the user does not exist yet
      await _data.read('users', email);
      return {status: 400, payload: {err: 'Validation', message: 'A user with that email already exists.'}, contentType: 'application/json'};
    }catch{

      // Hash the password
      const hashedPassword = hash(password);
      if(!hashedPassword){
        return {status: 500, payload: {err: 'Internal', message: 'Could not hash the user\'s password.'}, contentType: 'application/json'};
      }

      // Create the user on the Stripe API
      const postData = {
        name,
        email,
      };
          
      const options = {
        auth: `${config.stripeApiKey}:`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': stringify(postData).length,
        },
        port: 443,
        hostname: config.stripeApiHostname,
        path: '/v1/customers',
        method: 'POST',
      };
      const res = await httpsRequest(stringify(postData), options);
          
      // Successful
      if(!res.status && !res.payload){
            
        // Create user object
        const userObject = {
          name,
          email,
          hashedPassword,
          street_address,
          stripe_customer_id: res.id,
        };

        // Save user
        await _data.create('users', email, userObject);
        delete userObject.hashedPassword;
        debug(formatWithOptions({colors: true}, '[USERS][POST] Response: %O', userObject));
        return {status: 201, payload: userObject, contentType: 'application/json'};
      }

      // Error
      else{
        debug(formatWithOptions({colors: true}, '[USERS][POST] Error: %O', res));
        return {status: 500, payload: {err: 'Internal', message: 'Could not create the user.'}, contentType: 'application/json'};
      }
    }
  },

  // Required data: none, use token
  // Optional data: name, email, street_address, password (at least one must be specified)
  async put(request){
    debug(formatWithOptions({colors: true}, '[USERS][PUT] Request: %O', request));

    // Validate optional data
    const name = validate(request.payload.name, 'string');
    const optionalEmail = validate(request.payload.email, 'email');
    const street_address = validate(request.payload.street_address, 'string');
    const password = validate(request.payload.password, 'string');
    debug(formatWithOptions({colors: true}, '[USERS][PUT] VALIDATION: %O', {name, optionalEmail, street_address, password}));

    // At least one must be updated
    if(!name && !optionalEmail && !street_address && !password){
      const invalid = invalidFields({name, email: optionalEmail, street_address, password}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `At leat one of them must be updated: ${invalid}`}, contentType: 'application/json'};
    }

    // Look up the user data
    const user = await _data.read('users', request.token.email);

    // Updates user's data 
    if(name){
      user.name = name;
    }if(street_address){
      user.street_address = street_address;
    }if(optionalEmail && optionalEmail != request.token.email){
      user.email = optionalEmail;
    }if(password){
      user.hashedPassword = hash(password);
    }

    // Save with different email
    if(optionalEmail && optionalEmail != request.token.email){
      // Save with the new email
      await _data.create('users', optionalEmail, user);

      // Updates email on Stripe API
      const options = {
        auth: `${config.stripeApiKey}:`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': stringify({email: optionalEmail}).length,
        },
        port: 443,
        hostname: config.stripeApiHostname,
        path: `/v1/customers/${user.stripe_customer_id}`,
        method: 'POST', // yep, its POST
      };
      const res = await httpsRequest(stringify({email: optionalEmail}), options);

      // Error, cancel the update
      if(res.status && res.payload){
        debug(formatWithOptions({colors: true}, '[USERS][PUT] Error: %O', res));
        return {status: 500, payload: {err: 'Internal', message: 'Could not update the user.'}, contentType: 'application/json'};
      }else{
        debug(formatWithOptions({colors: true}, '[USERS][PUT][STRIPE] Response: %O', res));
      }

      // Update the token
      await _data.update('tokens', request.token.token_id, {...request.token, email: optionalEmail});

      // Remove old
      await _data.delete('users', request.token.email);
    }
    
    // Save with same email
    else{
      await _data.update('users', request.token.email, user);
    }

    delete user.hashedPassword;
    debug(formatWithOptions({colors: true}, '[USERS][PUT] Response: %O', user));
    return {status: 200, payload: user, contentType: 'application/json'};
  },

  // Required data: none, uses /:email
  // optional data: none
  async delete(request){
    debug(formatWithOptions({colors: true}, '[USERS][DELETE] Request: %O', request));

    // Validates the email to prevent the user from accidentally deleting their account
    // Inside all API handlers, slug[0] is the route, the next one is our :email
    const email = validate(request.slugs[1], 'email');
    debug(formatWithOptions({colors: true}, '[USERS][DELETE] VALIDATION: %O', {email}));

    if(!email){
      return {status: 400, payload: {err: 'Validation', message: `Missing /:email`}, contentType: 'application/json'};
    }
      
    // Look up user data and compare with the sent email
    // The token could be used to delete correctly, however, this is done to prevent the user from accidentally deleting his account
    const user = await _data.read('users', email);
    if(user.email != email){
      return {status: 401, payload: {err: 'Bad request', message: 'You cannot delete others\' account.'}, contentType: 'application/json'};
    }

    // Delete from Stripe API
    const options = {
      auth: `${config.stripeApiKey}:`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify({}).length,
      },
      port: 443,
      hostname: config.stripeApiHostname,
      path: `/v1/customers/${user.stripe_customer_id}`,
      method: 'DELETE',
    };
    const res = await httpsRequest(stringify({}), options);
    const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not delete the user.'}, contentType: 'application/json'};

    // Success
    if(!res.status && !res.payload && res.deleted){
      // remove carts, user and token
      await _data.delete('carts', request.token.email, errObj);
      await _data.delete('tokens', request.token.token_id, errObj);
      await _data.delete('users', request.token.email, errObj);

      return {status: 204, payload: {}, headers: deleteCookieHeader(), contentType: 'application/json'};    
    }else{
      debug(formatWithOptions({colors: true}, '[USERS][DELETE] Error: %O', res));
      return errObj;
    }
  },
}