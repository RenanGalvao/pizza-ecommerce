/*
* Order Handler
*/
import _data from '../../data.js';
import { safeFloatNumber, httpsRequest, stringify, getHTMLfromURL, validate } from '../../helpers.js';
import { debuglog, formatWithOptions } from 'util'; 
import config from '../../../config.js';

// Setting debug name for the file
const debug = debuglog('order');


export default {

  // Required data: none
  // Optional data: none
  async post(request) {
    debug(formatWithOptions({colors: true}, '[ORDER][POST] Request: %O', request));

    // Only create the order if the user has items in the cart and a payment card
    const userData = await _data.read('users', request.token.email);
    if(!userData.stripe_card_id){
      return {status: 400, payload: {err: 'Bad Request', message: 'You do not have a card to place an order.'}, contentType: 'application/json'};
    }

    const errObj = {status: 400, payload: {err: 'Bad Request', message: 'You do not have a cart to place an order.'}, contentType: 'application/json'};
    const cart = await _data.read('carts', request.token.email, errObj);
    debug(formatWithOptions({colors: true}, '[ORDER][POST] Cart: %O', cart));

    
    // Calculate the price
    let total = 0;
    for(const item of cart.items){
      // Retrieve the actual price to do the calculations
      const menuErrObj = {status: 500, payload: {err: 'Internal', message: 'Could not calculate the price.'}, contentType: 'application/json'};
      const itemData = await _data.read('menu', item.item_id, menuErrObj);
      total = safeFloatNumber(total + safeFloatNumber(itemData.price * item.quantity));
    }

    // A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge $1.00)
    // Do not need the safeFloatNumber, because a decimal of two places multiplied by 100 generates an integer.
    total *= 100;

    const postData = {
      amount: total,
      currency: 'usd',
      source: userData.stripe_card_id, // User card's id
      customer: userData.stripe_customer_id, // Stripe customer id
    };

    const options = {
      auth: `${config.stripeApiKey}:`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify(postData).length,
      },
      port: 443,
      hostname: config.stripeApiHostname,
      path: '/v1/charges',
      method: 'POST',
    };
    const res = await httpsRequest(stringify(postData), options);
    
    if(!res.paid){
      debug(formatWithOptions({colors: true}, '[ORDER][POST] Response: %O', res));
      return {status: 500, payload: {err: 'Internal', message: 'Could not complete the order.'}, contentType: 'application/json'};
    }
      
    // Delete the cart
    await _data.delete('carts', request.token.email);

    // Retrieve receipt as HTML
    const tmpReceipt = await getHTMLfromURL(res.receipt_url);
    const receipt = validate(tmpReceipt, 'string', {min: 1000});
    debug(formatWithOptions({colors: true}, '[ORDER][POST] Receipt Response: %O', receipt));

    if(!receipt){
      return {status: 500, payload: {err: 'Internal', message: 'Could not retrieve receipt'}, contentType: 'application/json'};
    }

    // Send the receipt to user
    const emailData = {
      from: `Pizza <me@${config.mailGunDomainName}>`,
      to: request.token.email,
      subject: 'Receipt from your shopping',
      html: receipt,
    };
        
    const optionsSendEmail = {
      auth: `api:${config.mailGunApiKey}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': stringify(emailData).length,
      },
      port: 443,
      hostname: config.mailGunApiHostname,
      path: `/v3/${config.mailGunDomainName}/messages`,
      method: 'POST',
    };
    const sendEmail = await httpsRequest(stringify(emailData), optionsSendEmail);
    debug(formatWithOptions({colors: true}, '[ORDER][POST] MailGun Response: %O', sendEmail));
        
    debug(formatWithOptions({colors: true}, '[ORDER][POST] Response: %O', res));
    return {status: 201, payload: {message: 'Thank you for your preference. The receipt was sent to your email.'}, contentType: 'application/json'};
  },
}