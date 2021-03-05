/*
* Based of login.js
*/
async function formHandler(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const street_address = document.getElementById('street_address').value;
    const password = document.getElementById('password').value;

    // Send request
    const [status, res] = await makeRequest('POST', `${window.location.origin}/api/users`, {name, email, street_address, password});

    if(status == 201){

        // Auto login then redirect 
        const [statusCode, token] = await makeRequest('POST', `${window.location.origin}/api/login`, {email, password});
        
        if(statusCode == 200){
            localStorage.setItem('auth', true);
            window.location = '/';
        }else{
            // Fallback redirect to login page
            window.location = '/login';
        }
    }else{
        couldNotCreateUser(status, res);
    }
} 

function formValidator(){
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const street_address = document.getElementById('street_address');
    const password = document.getElementById('password');

    name.oninput = () => {
        const nameRegex = /\w+\s\w+\s?.*/;
        validateInput('sign-up-form', name, nameRegex);
        updateSubmit(['name', 'email', 'street_address', 'password'], 'submit');
    };
    email.oninput = () => {
        const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        validateInput('sign-up-form', email, emailRegex);
        updateSubmit(['name', 'email', 'street_address', 'password'], 'submit');
    };
    street_address.oninput = () => {
        validateInput('sign-up-form', street_address, /.?/);
        updateSubmit(['name', 'email', 'street_address', 'password'], 'submit');
    };
    password.oninput = () => {
        validateInput('sign-up-form', password, /.{8,}/);
        updateSubmit(['name', 'email', 'street_address', 'password'], 'submit');
    };
}

function couldNotCreateUser(status, res) {
    console.log(status, res);
}


/**
* Load
**/
document.addEventListener('DOMContentLoaded', async () => {
    if(isLogged()){
        window.location = '/';
    }
    
    document.getElementById('sign-up-form').onsubmit = formHandler;
    formValidator();
});