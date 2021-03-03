/**
* Index Page
**/

function handleOrderNowButton() {
    document.getElementById('action-button').onclick = () => {
        const carousel = document.getElementById('carousel');
        scrollSmothlyTo(carousel.offsetTop);
    }
}

async function loadCarousel(){
    const carouselRoot = document.getElementById('carousel');
    const [status, items] = await makeRequest('GET', `${window.location.origin}/api/menu`);
    const carouselHtml = generateCarouselHtml(items);
    insertCarouselInHtml(carouselRoot, carouselHtml);
}

// Specific for this carousel and page
function generateCarouselHtml(items){
    let carouselHtml = [];

    for(const item of items){
        carouselHtml.push(`
            <div class="image">
                <img class="product" src="${item.image}" alt="${item.name}">
            </div>
            <div class="info">
               <h1 class="title">${item.name} <span class="price">$${item.price}</span></h1>
               <p class="description">${item.description}</p>
            </div>
            <button class="buy">
               <img src="/public/svg/shop_cart.svg" alt="Buy button">
            </button>`
        );
    }
    return carouselHtml;
}



async function loadItemsFromMenu() {
    const [status, items] = await makeRequest('GET', `${window.location.origin}/api/menu`);

    if(status == 200){
        insertItemsInHTML(items);
    }else{
        const mockedItem = {
            id: '',
            name: '',
            price: 0,
            description: '',
            category: '',
        };
        const placeHolder = new Array(mockedItem).fill(6);
        insertItemsInHtml(placeHolder);
    }
}

function insertItemsInHTML(items){
    const productList = document.querySelector('#product-list');

    for(const item of items){
        productList.innerHTML = `
        <div class="item">
            <img class="image" src="${item.image}" alt="${item.name}">
            <div class="info">
                <div class="text">
                    <h1 class="title">${item.name}</h1>
                    <p class="description">${item.description}</p>
                </div>
                <div class="icons">
                    <div class="price">
                        <img src="/public/svg/dolar_sign.svg" alt="dolar sign">
                        <span>${item.price}</span>
                    </div>
                    <button class="buy"><img src="/public/svg/shop_cart.svg" alt="buy button"></button>
                </div>
            </div>
        </div>` + productList.innerHTML; // Append at top
    }
}

/**
* Load
**/
document.addEventListener('DOMContentLoaded', async () => {
    await loadItemsFromMenu();
    handleOrderNowButton();
    loadCarousel();
});
