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
    
/**
* Load
**/
document.addEventListener('DOMContentLoaded', () => {
    menu();
    loggedInOut();
});