async function formHandler(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Send request
    const [status, res] = await makeRequest('POST', `${window.location.origin}/api/login`, {email, password});

    if(status == 200){
        localStorage.setItem('auth', true);
        window.location = '/';
    }else{
        document.querySelector('.form-input input[type="submit"]').setAttribute('disabled', '');
        if(status == 400){
            modal('Invalid login', 'Please, verify your email and password.', 'error').show();
        }else{
            modal(
                'Invalid login', 
                'Email not registered. Please <a href="/sign-up">sign up</a>.', 
                'error'
            ).show();
        }
    }
}   

function formValidator(){
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    email.oninput = () => {
        const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
        validateInput('login-form', email, emailRegex);
        updateSubmit(['email', 'password'], 'submit');
    };
    password.oninput = () => {
        const passwordRegex = /.{8,}/;
        validateInput('login-form', password, passwordRegex);
        updateSubmit(['email', 'password'], 'submit');
    };
}


/**
* Load
**/
document.addEventListener('DOMContentLoaded', async () => {
    
    if(isLogged()){
        window.location = '/';
    }
    
    // Event listeners
    document.getElementById('login-form').onsubmit = formHandler;
    formValidator();

    // Clean form to avoid filled inputs with no validation
    document.getElementById('login-form').reset();
    document.querySelector('.form-input input[type="submit"]').setAttribute('disabled', '');
});