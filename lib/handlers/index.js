/*
* Route Handlers
*/
import _users from './api/users.js';
import _login from './api/login.js';
import _logout from './api/logout.js';
import _menu from './api/menu.js';
import _cart from './api/cart.js';
import _order from './api/order.js';
import _card from './api/card.js'
import loadToken from '../middlewares/loadToken.js';
import verifyToken from '../middlewares/verifyToken.js';
import { errorHandler, getTemplate, getStaticAsset } from '../helpers.js';
import path from 'path';
import { debuglog, formatWithOptions } from 'util';

// Setting debug name for the file
const debug = debuglog('handlers');

// Lib object
let handlers = {
  gui: {},
};

/*-- Start GUI Handlers --*/


/*
* Index
*/
handlers.gui.index = async request => {
  debug(formatWithOptions({colors: true}, '[INDEX][HANDLER] Request: %O', request));
  
  if(request.method != 'get'){
    return handlers._methodNotAllowed;
  }

  try{
    const data = {
      'head.title': 'Home',
      'head.description': 'Order the pizza you love in a few seconds.',
      'head.css': 'index.css',
      'head.js': 'index.js',
    }
    const payload = await getTemplate('', 'index', data);
    return {status: 200, payload, contentType: 'text/html'};
  }catch(err){
    return errorHandler(err);
  }
}


/*
* Login
*/
handlers.gui.login = async request => {
  debug(formatWithOptions({colors: true}, '[LOGIN][HANDLER] Request: %O', request));
  
  if(request.method != 'get'){
    return handlers._methodNotAllowed;
  }

  try{
    const data = {
      'head.title': 'Login',
      'head.description': 'Delicious pizzas are wainting you.',
      'head.css': 'login.css',
      'head.js': 'login.js',
    }
    const payload = await getTemplate('', 'login', data);
    return {status: 200, payload, contentType: 'text/html'};
  }catch(err){
    return errorHandler(err);
  }
}


/*
* Sign Up
*/
handlers.gui.signup = async request => {
  debug(formatWithOptions({colors: true}, '[SIGN_UP][HANDLER] Request: %O', request));
  
  if(request.method != 'get'){
    return handlers._methodNotAllowed;
  }

  try{
    const data = {
      'head.title': 'Sign Up',
      'head.description': 'Delicious pizzas are wainting you.',
      'head.css': 'sign-up.css',
      'head.js': 'sign-up.js',
    }
    const payload = await getTemplate('', 'sign-up', data);
    return {status: 200, payload, contentType: 'text/html'};
  }catch(err){
    return errorHandler(err);
  }
}


/*-- End GUI Handlers --*/


/*-- Start API Handlers --*/


/*
* Users
*/
handlers.users = async request => {
  debug(formatWithOptions({colors: true}, '[USER][HANDLER] Request: %O', request));

  if(request.method != 'post'){
    const err = await handlers._useMiddleware(request, verifyToken);
    if(err){
      debug(formatWithOptions({colors: true}, '[USERS][HANDLER] Error: %O', err));
      return err;
    }
  }
  return handlers._callSubApi(request, _users, handlers._crudMethods);
};


/*
* Login
*/
handlers.login = async request => {
  debug(formatWithOptions({colors: true}, '[LOGIN][HANDLER] Request: %O', request));

  if(request.method == 'post'){
    return handlers._callSubApi(request, _login);
  }else{
    return handlers._methodNotAllowed;
  }
}


/*
* Logout
*/
handlers.logout = async request => {
  debug(formatWithOptions({colors: true}, '[LOGOUT][HANDLER] Request: %O', request));

  if(request.method == 'get'){
    await handlers._useMiddleware(request, loadToken);
    return handlers._callSubApi(request, _logout);
  }else{
    return handlers._methodNotAllowed;
  }
}


/*
* Menu
*/
handlers.menu = async request => {
  debug(formatWithOptions({colors: true}, '[MENU][HANDLER] Request: %O', request));

  if(request.method != 'get'){
    const err = await handlers._useMiddleware(request, verifyToken);
    if(err){
      debug(formatWithOptions({colors: true}, '[USERS][HANDLER] Error: %O', err));
      return err;
    }
  }
  return handlers._callSubApi(request, _menu, handlers._crudMethods);
}


/*
* Cart
*/
handlers.cart = async request => {
  debug(formatWithOptions({colors: true}, '[CART][HANDLER] Request: %O', request));

  // Each user can only view, create, edit and delete their own cart
  if(handlers._crudMethods.includes(request.method)){
    const err = await handlers._useMiddleware(request, verifyToken);
    if(err){
      return err;
    }
    return handlers._callSubApi(request, _cart);
  }else{
    return handlers._methodNotAllowed;
  }
}


/*
* Card
*/
handlers.card = async request => {
  debug(formatWithOptions({colors: true}, '[CARD][HANDLER] Request: %O', request));

  // Each user can only view, create, edit and delete their own order
  if(handlers._crudMethods.includes(request.method)){
    const err = await handlers._useMiddleware(request, verifyToken);
    if(err){
      return err;
    }
    return handlers._callSubApi(request, _card);
  }else{
    return handlers._methodNotAllowed;
  }
}


/*
* Order
*/
handlers.order = async request => {
  debug(formatWithOptions({colors: true}, '[ORDER][HANDLER] Request: %O', request));

  // Each user can only view, create, edit and delete their own order
  if(request.method == 'post'){
    const err = await handlers._useMiddleware(request, verifyToken);
    if(err){
      return err;
    }
    return handlers._callSubApi(request, _order);
  }else{
    return handlers._methodNotAllowed;
  }
}

/*-- End API Handlers --*/

/*-- Start Static Asset Handlers --*/

// Note that Nginx is serving the files
handlers.favicon = async request => {
  debug(formatWithOptions({colors: true}, '[FAVICON][HANDLER] Request: %O', request));

  if(request.method != 'get'){
    return handlers._methodNotAllowed;
  }

  try{
    const errObj = {status: 500, payload: {err:'Internal', message: 'Could not retrieve the file'}, contentType: 'application/json'};
    const [favicon, contentType] = await getStaticAsset('favicon.ico', errObj);
    return {status: 200, payload: favicon, contentType};
  }catch(err){
    debug(formatWithOptions({colors: true}, '[FAVICON][HANDLER] Error: %O', err));
    return errorHandler(err);
  }
}

handlers.public = async request => {
  debug(formatWithOptions({colors: true}, '[PUBLIC][HANDLER] Request: %O', request));

  if(request.method != 'get'){
    return handlers._methodNotAllowed;
  }
  if(request.slugs.length == 0){
    return handlers.notFound(request);
  }

  // Set up the path to the file
  const pathToFile = path.join(...request.slugs);

  try{
    const [payload, contentType] = await getStaticAsset(pathToFile, handlers.notFound(request));
    return {status: 200, payload, contentType};
  }catch(err){
    debug(formatWithOptions({colors: true}, '[PUBLIC][HANDLER] Error: %O', err));
    return errorHandler(err);
  }
}
/*-- End Static Asset Handlers --*/


/*
* Handler Methods & properties
*/
handlers._methodNotAllowed = {status: 405, payload: {}, contentType: 'application/json'};
handlers._crudMethods = ['get', 'post', 'put', 'delete'];
handlers._baseRoutes = ['all', 'create', 'edit', 'deleted'];

handlers.notFound = async request => {
  debug(formatWithOptions({colors: true}, '[NOT_FOUND][HANDLER] Request: %O', request));

  try{
    const data = {
      'head.title': 'Not Found',
      'head.description': 'The page you were looking for doesn\'t exist.',
      'content.id': 'not-found',
    }
    const payload = await getTemplate('', '_not-found', data);
    return {status: 404, payload, contentType: 'text/html'};
  }catch(err){
    debug(formatWithOptions({colors: true}, '[NOT_FOUND][HANDLER] Error: %O', err));
    return errorHandler(err);
  }
};


handlers._callSubApi = async (request, sub, acceptedMethods = handlers._crudMethods) => {
  debug(formatWithOptions({colors: true}, '[_CALL_SUB_API][HANDLER] Request: %O\nSub: %O\nAccepted Methods: %O\n', request, sub, acceptedMethods));

  if(acceptedMethods.includes(request.method)){
    try{
      const res =  await sub[request.method](request);
      
      // Renew Token from laodToken.js
      if(request.setHeader){
        // If none was sent by the handlers, set to {}
        res.headers = typeof res.headers == 'object' ? res.headers : {};
        // Merge
        Object.assign(res.headers, request.setHeader); 
      }
      return res;
    }catch(err){
      // Send all errors to this function, avoids try and catch inside controllers
      debug(formatWithOptions({colors: true}, '[_CALL_SUB_API][HANDLER] Error: %O', err));
      return errorHandler(err);
    }
  }else{
    return {status: 405, payload: {}, contentType: 'application/json'};
  }
};

handlers._callSubGui = async (request, sub, acceptedRoutes = handlers._baseRoutes) => {
  debug(formatWithOptions({colors: true}, '[_CALL_SUB_GUI][HANDLER] Request: %O\nSub: %O\nAccepted Routes: %O\n', request, sub, acceptedRoutes));

  if(acceptedRoutes.includes(request.slugs[0])){
    try{
      return await sub[request.slugs[0]](request);
    }catch(err){
      // Send all errors to this function, avoids try and catch inside controllers
      debug(formatWithOptions({colors: true}, '[_CALL_SUB_GUI][HANDLER] Error: %O', err));
      return errorHandler(err);
    }
  }else{
    return {status: 405, payload: {}, contentType: 'application/json'};
  }
}

handlers._useMiddleware = async (request, fn, errMsg) => {
  debug(formatWithOptions({colors: true}, '[MIDDLEWARE][HANDLER] Request: %O', request));
  let error = false;

  try{
    await fn(request, (err) => {
      // If something goes wrong, will be a err
      if(err) {
        debug(formatWithOptions({colors: true}, '[MIDDLEWARE][HANDLER] Error: %O', err));
        error = err;
      }
    });
  }catch(err){
    debug(formatWithOptions({colors: true}, '[MIDDLEWARE][HANDLER] Error: %O', err));
    return errorHandler(err);
  }
  
  if(error){
    return errorHandler(error);
  }
};

export default handlers;