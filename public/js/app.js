/**
* Global script
**/


/* General use */
//@TODO criar um espaço para querystring
function makeRequest(method, url, payload = {}){
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
        req.open(method, url, true);
        req.setRequestHeader('Accept', 'application/json');
        req.responseType = 'json'; // API only res JSON
        req.withCredentials = true; // Some requests may need it

        // Handle res
        req.onload = () => {
            resolve([req.status, req.response]);
        }
    
        // Handle error
        req.onerror = () => {
            // Probably the user
            console.log(req);
            resolve([400, {err: 'Internal', message: 'Could not make the request'}]);
        }

        req.send(JSON.stringify(payload));
    });
}

function validateInput(formId, inputElement, regex) {
    const fieldName = inputElement.getAttribute('name');

    if(!regex.test(inputElement.value)){
        inputElement.classList.remove('success');
        inputElement.classList.add('error');
        updateMessage(formId, fieldName, 'error');
    }else{
        inputElement.classList.remove('error');
        inputElement.classList.add('success');
        updateMessage(formId, fieldName, 'success');
    }
}

function updateMessage(formId, inputName, state) {
    setInvalidFields(formId, inputName, state);

    const form = document.getElementById(formId);
    const errorMsgDiv = form.querySelector(`input[name="${inputName}"] + .error-message`);
    const errors = form.getAttribute('data-error') ? form.getAttribute('data-error') : '';

    // update message
    if(errors.includes(inputName)){
        errorMsgDiv.style.maxHeight = '1rem';
    }else{
        errorMsgDiv.style.maxHeight = '0';
    }
}

function setInvalidFields(formId, input, state){
    const form = document.getElementById(formId);
    let prevState = form.getAttribute('data-error') ? form.getAttribute('data-error') : '';

    // Add input to data-error list
    if(state == 'error'){
        if(prevState.length > 0 && !prevState.includes(input)){
            form.setAttribute('data-error', `${input},${prevState}`); 
        }
        else if(prevState.length == 0){
            form.setAttribute('data-error', input);
        }
    }
    // Remove it
    else{
        if(prevState.includes(input)){
            let errors = prevState.split(',');
            errors.splice(errors.indexOf(input), 1);
            form.setAttribute('data-error', errors);
        }
    }
}

function updateSubmit(elementsId, submitId) {
    let elements = [];
    const submit = document.getElementById(submitId);

    for(const id of elementsId){
        elements.push(document.getElementById(id));
    }

    // Verify
    for(const element of elements){
        if(!element.classList.contains('success')){
            submit.setAttribute('disabled', '');
            return;
        }
    }

    // Nothing wrong, let user send the form
    submit.removeAttribute('disabled')
}

function scrollSmothlyTo(height) {
    // take in account navbar's height
    const navbarHeight = document.getElementById('navbar').offsetHeight;
    window.scrollTo({top: height - navbarHeight, behavior: 'smooth'});
}

/*  Carousel */
function insertCarouselInHtml(rootElement, itemsHTML){
    // Inject
    rootElement.innerHTML = generateSimpleCarousel(itemsHTML) + rootElement.innerHTML;
    rootElement.querySelector('#dots').innerHTML = carouselControl(itemsHTML.length);

    // Bind controls to items
    const dots = document.getElementsByClassName('dot');
    const carousel = document.querySelector('.carousel-item:first-child');
    const widthOfCarouselItem = carousel.offsetWidth;
    
    for(const dot of dots){
        dot.onclick = event => {
            let i = Number(event.target.getAttribute('data-value'));
            carousel.style.marginLeft = `-${i++ * widthOfCarouselItem}px`;
        };
    }
}   

function generateSimpleCarousel(itemsHTML){
    let carousel = '';

    for(const item of itemsHTML){
        carousel += `<div class="carousel-item">${item}</div>`;
    }
    return carousel;
}

function carouselControl(itemsLength){
    let dots = '';

    for(let i = 0; i < itemsLength; i++){
        dots += `<button data-value="${i}" class="dot"></button>`;
    }
    return dots;
}


/* User menu */
function menu() {
    const menuButton = document.getElementById('menu-button');
    const menu = document.getElementById('menu');

    menuButton.onclick = () => {
        // Toggle .active class
        menu.classList.toggle('active');
    }
        
    // Close icon
    menu.querySelector('a:first-child').onclick = event => {
        event.preventDefault();
        menu.classList.remove('active');
    }
}

function loggedInOut() {
   const loggedIn = getParentOfElementsWithClass('logged-in');
   const loggedOut = getParentOfElementsWithClass('logged-out');
   
   if(!isLogged()){
       setClassToMenuItems(loggedIn, 'hide', 'add');
       setClassToMenuItems(loggedOut, 'hide', 'remove');
   }else{
       setClassToMenuItems(loggedOut, 'hide', 'add');
       setClassToMenuItems(loggedIn, 'hide', 'remove');
   }

   function getParentOfElementsWithClass(className) {
       const baseElements = document.getElementsByClassName(className);
       let list = [];

       for(const element of baseElements){
           list.push(element.parentElement);
       }
       return list;
   }

   function setClassToMenuItems(list, className, operation){
       for(const item of list){
           item.classList[operation](className);
       }
   }
}

function isLogged() {
    // !! turns into boolean
    return !!localStorage.getItem('auth');
}

async function logout() {
    const [status, res] = await makeRequest('GET', `${window.location.origin}/api/logout`);
    
    if(status == 204){
        localStorage.removeItem('auth');
        window.location = '/';
    }else{
        console.log('Something went wrong', res);
    }
}

/* Modal */
function modal(title, message, state) {
    const modal = document.getElementById('modal');
    const secondsToHide = 5;
    
    function show(){
        setup();
        modal.style.top = '15vh';
    }

    function hide(){
        modal.style.top = '-20vh';
    }

    function setup(){
        modal.classList.remove('error', 'success');
        modal.querySelector('h1').innerHTML = title;
        modal.querySelector('p').innerHTML = message;
        modal.classList.add(state);
    }

    modal.querySelector('i').onclick = () => {
        hide();
    }

    setTimeout(() => {
        hide();
    }, secondsToHide * 1000);

    return {show}
}
    
/**
* Load
**/
document.addEventListener('DOMContentLoaded', () => {
    menu();
    loggedInOut();

    document.getElementById('logout').onclick = event => {
        event.preventDefault();

        logout();
    };
});