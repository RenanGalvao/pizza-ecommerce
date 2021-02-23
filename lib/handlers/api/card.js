/*
* Card Handler
*/
import _data from '../../data.js';
import { validate, httpsRequest, invalidFields, stringify } from '../../helpers.js';
import { debuglog, formatWithOptions } from 'util';
import config from '../../../config.js';

// Setting debug name for the file
const debug = debuglog('card');


export default {

  // Show
  // Required data: none, use token
  // Optional data: none
  async get(request){
    debug(formatWithOptions({colors: true}, '[CARD][GET] Request: %O', request));

    // Require the card information from the Stripe API
    const options = {
      auth: `${config.stripeApiKey}:`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify({}).length,
      },
      port: 443,
      hostname: config.stripeApiHostname,
      path: `/v1/customers/${request.token.stripe_customer_id}/sources?object=card`,
      method: 'GET',
    };
    const res = await httpsRequest(stringify({}), options);

    // Successful request
    if(!res.status && !res.payload){

      // Verify if theres any card
      const data = res.data;

      if(data.length > 0){
        debug(formatWithOptions({colors: true}, '[CARD][GET] Response: %O', data[0]));
        return {status: 200, payload: data[0], contentType: 'application/json'};
      }else{
        return {status: 400, payload: {err: 'Bad request', message: 'You do not have any registered card.'}, contentType: 'application/json'};
      }
    }

    // Error
    else{
      debug(formatWithOptions({colors: true}, '[CARD][GET] Error: %O', res));
      return {status: 500, payload: {err: 'Internal', message: 'Could not create the user.'}, contentType: 'application/json'};
    }
  },

  // Required data: stripe_token https://stripe.com/docs/testing#cards (token tab)
  // Optional data: none
  async post(request){
    debug(formatWithOptions({colors: true}, '[CARD][POST] Request: %O', request));

    // Only register the card if the user has no other registered
    const userData = await _data.read('users', request.token.email);
    if(userData.stripe_card_id){
      return {status: 400, payload: {err: 'Bad request', message: 'Only one card can be registered.'}, contentType: 'application/json'};
    }

    // Validate
    const stripe_token = validate(request.payload.stripe_token, 'enum', {enumArr: this._stripe_tokens});
    debug(formatWithOptions({colors: true}, '[CARD][POST] Validation: %O', {stripe_token}));

    // Card's data object
    let postData = {};

    if(stripe_token){
      postData = {
        source: stripe_token,
      };
    }else{
      return {status: 400, payload: {err: 'Validation', message: `Missing or invalid value for stripe_token. Valid values are: ${this._stripe_tokens.join(', ')}.`}, contentType: 'application/json'};
    }

    // Create the card on the Stripe API
    const options = {
      auth: `${config.stripeApiKey}:`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify(postData).length,
      },
      port: 443,
      hostname: config.stripeApiHostname,
      path: `/v1/customers/${request.token.stripe_customer_id}/sources`,
      method: 'POST',
    };
    const res = await httpsRequest(stringify(postData), options);

    // Successful request
    if(!res.status && !res.payload){

      // If no error
      if(!res.error){

        // Save the card id within user's object
        userData.stripe_card_id = res.id;
        await _data.update('users', request.token.email, userData);

        debug(formatWithOptions({colors: true}, '[CARD][POST] Response: %O', userData));
        delete userData.hashedPassword;
        return {status: 201, payload: userData};

      }else{
        return {status: 400, payload: {err: 'Bad request', ...res.error}};
      }
    }
    
    // Error
    else{
      debug(formatWithOptions({colors: true}, '[CARD][POST] Error: %O', res));
      return {status: 500, payload: {err: 'Internal', message: 'Could not create the user.'}, contentType: 'application/json'};
    }
  },

  // Required data: none, uses token
  // Optional data: name, exp_month, exp_year
  async put(request){
    debug(formatWithOptions({colors: true}, '[CARD][PUT] Request: %O', request));

    // Checks if the user has a registered card
    const userData = await _data.read('users', request.token.email);
    if(!userData.stripe_card_id){
      return {status: 400, payload: {err: 'Bad request', message: 'You do not have any registered cards to update.'}, contentType: 'application/json'};
    }

    // Validate
    const name = validate(request.payload.name, 'string');
    const exp_month = validate(request.payload.exp_month, 'string', {min: 2, max: 2});
    const exp_year = validate(request.payload.exp_year, 'string', {min: 2, max: 4});
    debug(formatWithOptions({colors: true}, '[CARD][PUT] Validation: %O', {name, exp_month, exp_year}));

    if(!name && !exp_month && !exp_year){
      const invalid = invalidFields({name, exp_month, exp_year}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `At leat one of them must be updated: ${invalid}.`}, contentType: 'application/json'};
    }

    // Card's data object
    let postData = {};

    if(name){
      postData.name = name;
    }if(exp_month){
      postData.exp_month = exp_month;
    }if(exp_year){
      postData.exp_year = exp_year;
    }

    // Update the card on the Stripe API
    const options = {
      auth: `${config.stripeApiKey}:`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify(postData).length,
      },
      port: 443,
      hostname: config.stripeApiHostname,
      path: `/v1/customers/${request.token.stripe_customer_id}/sources/${userData.stripe_card_id}`,
      method: 'POST',
    };
    const res = await httpsRequest(stringify(postData), options);

     // Successful request
     if(!res.status && !res.payload){

      // If no error
      if(!res.error){

        // There is nothing to send to the user, just say everything is fine
        delete userData.hashedPassword;
        return {status: 200, payload: userData, contentType: 'application/json'};

      }else{
        return {status: 400, payload: {err: 'Bad request', ...res.error}, contentType: 'application/json'};
      }
    }
    
    // Error
    else{
      debug(formatWithOptions({colors: true}, '[USERS][PUT] Error: %O', res));
      return {status: 500, payload: {err: 'Internal', message: 'Could not update the card.'}, contentType: 'application/json'};
    }
  },

  // Required data: none, uses /:stripe_card_id
  // Optional data: none
  async delete(request) {
    debug(formatWithOptions({colors: true}, '[CARD][DELETE] Request: %O', request));

    // Validates the stripe_card_id to prevent the user from accidentally deleting their card
    // Inside all API handlers, slug[0] is the route, the next one is our :stripe_card_id
    const stripeCardId = validate(request.slugs[1], 'string');
    debug(formatWithOptions({colors: true}, '[CARD][DELETE] VALIDATION: %O', {stripeCardId}));

    if(!stripeCardId){
      return {status: 400, payload: {err: 'Validation', message: `Missing /:stripe_card_id`}, contentType: 'application/json'};
    }

    // Checks if the user has a registered card and compare with the sent :stripe_card_id
    const userData = await _data.read('users', request.token.email);
    if(!userData.stripe_card_id){
      return {status: 400, payload: {err: 'Bad request', message: 'You do not have any registered cards to update.'}, contentType: 'application/json'};
    }else if(userData.stripe_card_id != stripeCardId){
      return {status: 400, payload: {err: 'Bad request', message: 'You cannot delete others\' card.'}, contentType: 'application/json'};
    }

    // Delete the card on the Stripe API
    const options = {
      auth: `${config.stripeApiKey}:`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify({}).length,
      },
      port: 443,
      hostname: config.stripeApiHostname,
      path: `/v1/customers/${request.token.stripe_customer_id}/sources/${userData.stripe_card_id}`,
      method: 'DELETE',
    };
    const res = await httpsRequest(stringify({}), options);
    const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not delete the card.'}, contentType: 'application/json'};

     // Successful request
     if(!res.status && !res.payload){

      // If no error
      if(!res.error){

        // Delete and update user object
        delete userData.stripe_card_id;
        await _data.update('users', request.token.email, userData, errObj);

        // OK
        return {status: 204, payload: {}, contentType: 'application/json'};
      }
    }
    
    // Error
    else{
      debug(formatWithOptions({colors: true}, '[CARD][DELETE] Error: %O', res));
      return errObj;
    }
  },

  _stripe_tokens: [
    'tok_visa', 
    'tok_visa_debit', 
    'tok_mastercard', 
    'tok_mastercard_debit', 
    'tok_mastercard_prepaid',
    'tok_amex',
    'tok_discover',
    'tok_diners',
    'tok_jcb',
    'tok_unionpay',
  ],
}