/*
* Cart Handler
*/
import _data from '../../data.js';
import { validate, invalidFields } from '../../helpers.js';
import { debuglog, formatWithOptions } from 'util';
import config from '../../../config.js';

// Setting debug name for the file
const debug = debuglog('cart');


export default {

  // Required data: none
  // Optional data: none
  async get(request) {
    debug(formatWithOptions({colors: true}, '[CART][GET] Request: %O', request));

    // Do not remove this try/catch, its part of the logic
    try{

      // Retrieve cart using user's token info
      const cart = await _data.read('carts', request.token.email);
      debug(formatWithOptions({colors: true}, '[CART][SHOW] Cart: %O', cart));
      return {status: 200, payload: cart, contentType: 'application/json'};
    }catch(err){

      // Cart doesn't exists, send an empty one
      if(err.code == 'ENOENT'){

        return {status: 200, payload: { items: []}, contentType: 'application/json'};
      }else{

        debug(formatWithOptions({colors: true}, '[CART][SHOW] Error: %O', err));
        return {status: 500, payload: {err: 'Internal', message: 'Could not get the cart.'}, contentType: 'application/json'};
      }
    }
  },

  // Required data: item_id, quantity
  // Optional data: none
  // Always push into the items array
  async post(request) {
    debug(formatWithOptions({colors: true}, '[CART][POST] Request: %O', request));

    // Validate
    const item_id = validate(request.payload.item_id, 'token', {equal: config.token.tokenIdLength});
    const quantity = validate(request.payload.quantity, 'number', {integer: true ,min: 1});
    debug(formatWithOptions({colors: true}, '[CART][VALIDATE]: %O', {item_id, quantity}));

    if(!item_id || !quantity){
      const invalid = helpers.invalidFields({item_id, quantity}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `Missing or invalid required fields: ${invalid}.`}, contentType: 'application/json'};
    }

    // Make sure the product exists. If it throws an error, it doesn't
    const errObj = {status: 400, payload: {err: 'Bad Request', message: 'Item doesn\'t exist.'}, contentType: 'application/json'};
    await _data.read('menu', item_id, errObj);

      // Do not remove this try/catch block
      try{

        // Append the item to the cart
        const itemObject = {
          item_id,
          quantity,
        };

        const cart = await _data.read('carts', request.token.email);

        // Sum quantity if item already exists
        for(const item of cart.items){
          if(item.item_id == item_id){
            itemObject.quantity += item.quantity
          }
        }
        cart.items.push(itemObject);

        // Save
        const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not save the item to cart.'}, contentType: 'application/json'};
        await _data.update('carts', request.token.email, cart, errObj);
        debug(formatWithOptions({colors: true}, '[CART][POST] Response: %O', cart));
        return {status: 201, payload: cart, contentType: 'application/json'};

      }catch{

        // If cart object doesn't exist, create one for the client
        const cart = {
          items: [{ item_id, quantity }],
        };

        const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not create the cart.'}, contentType: 'application/json'};
        await _data.create('carts', request.token.email, cart, errObj);
        debug(formatWithOptions({colors: true}, '[CART][POST] Response: %O', cart));
        return {status: 201, payload: cart, contentType: 'application/json'};
      }
  },

  // Required data: none, uses /:item_id
  // Optional data: none
  async put(request){
    debug(formatWithOptions({colors: true}, '[CART][PUT] Request: %O', request));

    // Validates :item_id
    // Inside all API handlers, slug[0] is the route, the next one is our :item_id
    const item_id = validate(request.slugs[1], 'token', {equal: config.token.tokenIdLength});
    const quantity = validate(request.payload.quantity, 'number', {integer: true, min: 1});
    debug(formatWithOptions({colors: true}, '[CART][VALIDATE]: %O', {item_id, quantity}));

    if(!item_id || !quantity){
      if(!item_id){
        return {status: 400, payload: {err: 'Validation', message: 'Missing /:item_id'}, contentType: 'application/json'};
      }
      const invalid = invalidFields({item_id, quantity}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `Missing or invalid required fields: ${invalid}.`}, contentType: 'application/json'};
    }

    // Make sure the user already has a cart
    const errObj = {status: 400, payload: {err: 'Bad Request', message: 'You don\'t have any cart to update.'}, contentType: 'application/json'};
    const cart = await _data.read('carts', request.token.email, errObj);
  
    // Controll var
    let updated = false;

    // Update the quantity
    for(const [i, item] of cart.items.entries()){
      if(item.item_id == item_id){
        cart.items[i].quantity = quantity;
        updated = true;
      }
    }

    if(!updated){
      return {status: 400, payload: {err: 'Bad Request', message: 'Invalid /:item_id.'}, contentType: 'application/json'};
    }

    // Save
    const updateErrObj = {status: 500, payload: {err: 'Internal', message: 'Could not update the cart.'}, contentType: 'application/json'};
    await _data.update('carts', request.token.email, cart, updateErrObj);
    debug(formatWithOptions({colors: true}, '[CART][PUT] Response: %O', cart));
    return {status: 200, payload: cart, contentType: 'application/json'};
  },

  
  // Required data: none, uses /:item_id
  // Optional data: none
  async delete(request){
    debug(formatWithOptions({colors: true}, '[CART][DELETE] Request: %O', request));

    // Validates :item_id
    // Inside all API handlers, slug[0] is the route, the next one is our :item_id
    const item_id = validate(request.slugs[1], 'token', {equal: config.token.tokenIdLength});

    if(!item_id){
      return {status: 400, payload: {err: 'Validation', message: `Missing /:item_id`}, contentType: 'application/json'};
    }
      
    // Make sure the user already has a cart
    const errObj = {status: 400, payload: {err: 'Bad Request', message: 'You do not have a cart to remove an item from it.'}, contentType: 'application/json'};
    const cart = await _data.read('carts', request.token.email, errObj);

    // Controll var
    let deleted = false;

    // Remove the item
    for(const [i, item] of cart.items.entries()){
      if(item.item_id == item_id){
        cart.items.splice(i, 1);
        deleted = true;
      }
    }

    if(!deleted){
      return {status: 400, payload: {err: 'Bad Request', message: 'Invalid /:item_id.'}, contentType: 'application/json'};
    }

    // Save
    const delteErrObj = {status: 500, payload: {err: 'Internal', message: 'Could not delete the item.'}, contentType: 'application/json'};
    await _data.update('carts', request.token.email, cart, delteErrObj);
    return {status: 204, payload: {}};
  },
}