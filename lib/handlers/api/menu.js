/*
* Menu Handler
*/
import _data from '../../data.js';
import { invalidFields, validate, createRandomString, filterList } from '../../helpers.js';
import { debuglog, formatWithOptions } from 'util';
import config from '../../../config.js';

// Setting debug name for the file
const debug = debuglog('menu');


export default {

  // Show
  // Required data: none, uses /:item_id
  // Optional data: none

  // List
  // Required data: none
  // Optional data: name, price, description, category (filters)
  async get(request) {
    debug(formatWithOptions({colors: true}, '[MENU][GET] Request: %O', request));

    // SHOW
    if(request.slugs.length > 1){
      
      // Validates :item_id
      // Inside all API handlers, slug[0] is the route, the next one is our :item_id
      const item_id = validate(request.slugs[1], 'token', {equal: config.token.tokenIdLength});
      debug(formatWithOptions({colors: true}, '[USERS][SHOW] VALIDATION: %O', {item_id}));

      if(!item_id){
        return {status: 400, payload: {err: 'Validation', message: `Missing /:item_id`}, contentType: 'application/json'};
      }

      // Retrieve the item
      const errObj = {status: 400, payload: {err: 'Bad Request', message: 'Item doesn\'t exist.'}, contentType: 'application/json'};
      const item = await _data.read('menu', item_id, errObj);
      debug(formatWithOptions({colors: true}, '[MENU][SHOW] Response: %O', item));
      return {status: 200, payload: item, contentType: 'application/json'};
    }

    // LIST
    else{

      // Validate optional data if any (filter)
      const name = validate(request.queryStringObject.get('name'), 'string');
      const price = validate(Number(request.queryStringObject.get('price')), 'number', {min: 0.01});
      const description = validate(request.queryStringObject.get('description'), 'string'); 
      const category = validate(request.queryStringObject.get('category'), 'enum', {enumArr: config.menu.categories});
      debug(formatWithOptions({colors: true}, '[MENU][LIST] Validation: %O', {name, price, description, category}));

      // Retrieve the list with the name of the items
      const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not get list of menu items.'}, contentType: 'application/json'};
      const list = await _data.list('menu', errObj);
      
      // Just return all items in menu
      let menu = [];
      if(!name && !price && !category && !description){
        for(const listItem of list){
          const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not get list of menu items.'}};
          let item = await _data.read('menu', listItem, errObj);
          menu.push(item);
        }
      }

      // Return based on filters
      else{
        const searchObj = {};
        if(name){
          searchObj.name = name;
        }if(price){
          searchObj.price = price;
        }if(description){
          searchObj.description = description;
        }if(category){
          searchObj.category = category;
        }

        menu = await filterList(list, 'menu', searchObj);
      }

      // filterList returns false when some error occurs
      if(!menu){
        return {status: 500, payload: {err: 'Internal', message: 'Could not filter the list.'}, contentType: 'application/json'};
      }

      debug(formatWithOptions({colors: true}, '[MENU][LIST] Response: %O', menu));
      return {status: 200, payload: menu, contentType: 'application/json'};
    }
  },

  // Required data: name, price, description, category
  // Optional data: none
  async post(request) {
    debug(formatWithOptions({colors: true}, '[MENU][POST] Request: %O', request));

    // Validate
    const name = validate(request.payload.name, 'string');
    const price = validate(request.payload.price, 'number', {min: 0.01}); 
    const description = validate(request.payload.description, 'string');
    const category = validate(request.payload.category, 'enum', {enumArr: config.menu.categories});
    debug(formatWithOptions({colors: true}, '[VALIDATION]: %O', {name, price, description, category}));

    if(!name || !price || !category || !description){
      const invalid = invalidFields({name, price, description, category}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `Missing or invalid required fields: ${invalid}.`}, contentType: 'application/json'};
    }

    // Create the item object
    const id = createRandomString(this._idLength);
    const itemObject = {
      id,
      name,
      price,
      description,
      category,
    };

    // Save the item
    const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not create the item.'}, contentType: 'application/json'};
    const item = await _data.create('menu', id, itemObject, errObj);
    debug(formatWithOptions({colors: true}, '[MENU][POST] Response: %O', item));
    return {status: 201, payload: item, contentType: 'application/json'};
  },

  // Required data: none, uses /:item_id
  // Optional data: name, price, description, category
  async put(request) {
    debug(formatWithOptions({colors: true}, '[MENU][PUT] Request: %O', request));

    // Validates :item_id
    // Inside all API handlers, slug[0] is the route, the next one is our :item_id
    const item_id = validate(request.slugs[1], 'token', {equal: config.token.tokenIdLength});
    
    // validate optional data
    const name = validate(request.payload.name, 'string');
    const price = validate(request.payload.price, 'number', {min: 0.01}); 
    const description = validate(request.payload.description, 'string');
    const category = validate(request.payload.category, 'enum', {enumArr: config.menu.categories});
    debug(formatWithOptions({colors: true}, '[VALIDATION]: %O', {item_id, name, price, description, category}));

    if(!item_id){
      return {status: 400, payload: {err: 'Validation', message: `Missing /:item_id`}, contentType: 'application/json'};
    }

    // At least one must be updated
    if(!name && !price && !description && !category){
      const invalid = invalidFields({name, street_adress, password}).join(', ');
      return {status: 400, payload: {err: 'Validation', message: `At leat one of them must be updated: ${invalid}.`}, contentType: 'application/json'};
    }

    // Retrieve item data
    const errObj = {status: 500, payload: {err: 'Internal', message: 'Could not retrieve the item.'}, contentType: 'application/json'};
    const item = await _data.read('menu', item_id, errObj);

    // Updates item's data
    if(name){
      item.name = name;
    }if(price){
      item.price = price;
    }if(description){
      item.description = description;
    }if(category){
      item.category = category;
    }

    // Save
    const updateErrObj = {status: 500, payload: {err: 'Internal', message: 'Could not update the item.'}, contentType: 'application/json'};
    await _data.update('menu', item_id, item, updateErrObj);
    debug(formatWithOptions({colors: true}, '[MENU][PUT] Response: %O', item));
    return {status: 200, payload: item, contentType: 'application/json'};
  },

  // Required data: none, uses /:item_id
  // Optional data: none
  async delete(request) {
    debug(formatWithOptions({colors: true}, '[MENU][DELETE] Request: %O', request));

    // Validates the :item_id to prevent the user from accidentally deleting their account
    // Inside all API handlers, slug[0] is the route, the next one is our :item_id
    const item_id = validate(request.slugs[1], 'token', {equal: config.token.tokenIdLength});
    debug(formatWithOptions({colors: true}, '[MENU][DELETE] VALIDATION: %O', {item_id}));
  
    if(!item_id){
      return {status: 400, payload: {err: 'Validation', message: `Missing /:item_id`}, contentType: 'application/json'};
    }

    try{
      // Do not tell the user if we deleted something or not. Always give the same answer.
      await _data.delete('menu', item_id);
    }catch(err){
      debug(formatWithOptions({colors: true}, '[MENU][DELETE] Error: %O', err));
    }
      
    return {status: 204, payload: {}, contentType: 'application/json'};
  },
}