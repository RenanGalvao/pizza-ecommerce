/*
* Based of login.js
*/
async function formHandler(event) {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const street_address = document.getElementById('street_address').value;
    const password = document.getElementById('password').value;
    const tos = document.getElementById('tos').value;

    // Send request
    const [status, res] = await makeRequest('POST', `${window.location.origin}/api/users`, {name, email, street_address, password, tos});

    if(status == 201){
        // Auto login then redirect 
        const [statusCode, token] = await makeRequest('POST', `${window.location.origin}/api/login`, {email, password});
        const timeOutSecs = 5;

        if(statusCode == 200){
            // Accout created, tell the user that he's gonna be redirected
            modal(
                'Congratulations', 
                'You account have been created. You gonna be redirected in 5 seconds. Or click <a href="/">here</a>.', 
                'success'
            ).show();
            localStorage.setItem('auth', true);

            setTimeout(() => {    
                window.location = '/';
            }, timeOutSecs * 1000);
        }else{
            // Fallback redirect to login page
            modal(
                'Congratulations',
                'You account have been created. Please, <a href="/login">login</a> to continue.',
                'success' 
            ).show();

            setTimeout(() => {
                window.location = '/login';
            }, timeOutSecs * 1000);
        }
    }else{
        document.querySelector('.form-input input[type="submit"]').setAttribute('disabled', '');
        modal(res.err, res.message, 'error').show();
    }
} 

function formValidator(){
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const street_address = document.getElementById('street_address');
    const password = document.getElementById('password');
    const password2 = document.getElementById('password2');
    const tos = document.getElementById('tos');


    ['input', 'change'].forEach(event => {
        name.addEventListener(event, nameValidator);
        email.addEventListener(event, emailValidator);
        street_address.addEventListener(event, streetValidator);
        password.addEventListener(event, passwordValidator);
        password2.addEventListener(event, passwordEqual);
        tos.addEventListener(event, tosValidator);
    });

    // fix and use on backend
    tos.onclick = event => {
        if(event.target.value == 'true'){
            event.target.value = 'false';
        }else{
            event.target.value = 'true';
        }
    }

    function nameValidator() {
        const nameRegex = /\w+\s\w+\s?.*/;
        validateInput('sign-up-form', name, nameRegex);
        updateSubmit(['name', 'email', 'street_address', 'password', 'password2', 'tos'], 'submit');
    }

    function emailValidator() {
        const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        validateInput('sign-up-form', email, emailRegex);
        updateSubmit(['name', 'email', 'street_address', 'password', 'password2', 'tos'], 'submit');
    }


    function streetValidator() {
        validateInput('sign-up-form', street_address, /.+/);
        updateSubmit(['name', 'email', 'street_address', 'password', 'password2', 'tos'], 'submit');
    }

    function passwordValidator() {
        validateInput('sign-up-form', password, /.{8,}/);
        updateSubmit(['name', 'email', 'street_address', 'password', 'password2', 'tos'], 'submit');

        passwordEqual();
    }

    function passwordEqual() {
        const passwordRegex = password.value.length > 0 ? new RegExp(`^${password.value}$`) : /[^0-9a-zA-Z]/;
        validateInput('sign-up-form', password2, passwordRegex);
        updateSubmit(['name', 'email', 'street_address', 'password', 'password2', 'tos'], 'submit');
    }

    function tosValidator() {
        validateInput('sign-up-form', tos, /true/);
        updateSubmit(['name', 'email', 'street_address', 'password', 'password2', 'tos'], 'submit');
    }
}


/**
* Load
**/
document.addEventListener('DOMContentLoaded', async () => {
    if(isLogged()){
        window.location = '/';
    }
    
    // Event listeners
    document.getElementById('sign-up-form').onsubmit = formHandler;
    formValidator();

    // Clean form to avoid filled inputs with no validation
    document.getElementById('sign-up-form').reset();
    document.querySelector('.form-input input[type="submit"]').setAttribute('disabled', '');
});