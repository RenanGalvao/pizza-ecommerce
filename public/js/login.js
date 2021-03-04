async function formHandler(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Send request
    const [status, token] = await makeRequest('POST', `${window.location.origin}/api/login`, {email, password});

    if(status == 200){
        localStorage.setItem('auth', true);
        window.location = '/';
    }else{
        invalidLogin();
    }
}   


function formValidator(){
    const emailIput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailIput.oninput = () => {
        validateEmail();
    };
    passwordInput.oninput = () => {
        validatePassword()
    };
}

function validateEmail() {
    const emailIput = document.getElementById('email');
    const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

    if(!emailRegex.test(emailIput.value)){
        emailIput.classList.remove('success');
        emailIput.classList.add('error');
        updateMessage('email', 'error');
    }else{
        emailIput.classList.remove('error');
        emailIput.classList.add('success');
        updateMessage('email', 'success');
    }
    updateSubmit();
}

function validatePassword() {
    const passwordInput = document.getElementById('password');

    if(passwordInput.value.length < 8){
        passwordInput.classList.remove('success');
        passwordInput.classList.add('error');
        updateMessage('password', 'error');
    }else{
        passwordInput.classList.remove('error');
        passwordInput.classList.add('success');
        updateMessage('password', 'success');
    }
    updateSubmit();
}

function updateMessage(input, state) {
    const form = document.getElementById('login-form');
    const padLock = document.querySelector('.form-image i');
    const emailInput = document.getElementById('email');
    const emailErrDiv = document.querySelector('input[type="email"] + .error-message');
    const passwordErrDiv = document.querySelector('input[type="password"] + .error-message');
    
    setInvalidFields(input, state);

    // update message
    const errors = form.getAttribute('data-error') ? form.getAttribute('data-error') : '';
    if(errors.includes('email') && errors.includes('password')){
        emailErrDiv.style.maxHeight = '1rem';
        passwordErrDiv.style.maxHeight = '1rem';

    }else if(errors.includes('email') || errors.includes('password')){
        if(errors.includes('email')){
            emailErrDiv.style.maxHeight = '1rem';
        }else{
            passwordErrDiv.style.maxHeight = '1rem';
        }
    }else{
        emailErrDiv.style.maxHeight = '0';
        passwordErrDiv.style.maxHeight = '0';
        padLock.style.color = '#c4c4c4';
    }

}

function setInvalidFields(input, state){
    const form = document.getElementById('login-form');

    if(input == 'email'){
        if(state == 'error'){
            let email = form.getAttribute('data-error') &&  form.getAttribute('data-error').includes('password') ? 'email, password' : 'email';
            form.setAttribute('data-error', email)
        }else{
            let email = form.getAttribute('data-error') &&  form.getAttribute('data-error').includes('password') ? 'password' : '';
            if(email == ''){
                form.removeAttribute('data-error');
            }else{
                form.setAttribute('data-error', email);
            }
        }
    }else{
        if(state == 'error'){
            let password = form.getAttribute('data-error') &&  form.getAttribute('data-error').includes('email') ? 'email, password' : 'password';
            form.setAttribute('data-error', password)
        }else{
            let password = form.getAttribute('data-error') &&  form.getAttribute('data-error').includes('email') ? 'email' : '';
            if(password == ''){
                form.removeAttribute('data-error');
            }else{
                form.setAttribute('data-error', password)
            }
        }
    }
}

function updateSubmit() {
    const emailIput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitInput = document.getElementById('submit');

    if(emailIput.classList.contains('success') && passwordInput.classList.contains('success')){
        submitInput.removeAttribute('disabled');
    }else{
        submitInput.setAttribute('disabled', '');
    }
}

function invalidLogin() {
    document.querySelector('.form-image i').style.color = 'rgba(220, 53, 69, .8)';
    document.querySelector('.form-input input[type="submit"]').setAttribute('disabled', '');

    alert('Invalid email and/or password. Please, try again.')
}


/**
* Load
**/
document.addEventListener('DOMContentLoaded', async () => {
    
    if(isLogged()){
        window.location = '/';
    }
    
    document.getElementById('login-form').onsubmit = formHandler;
    formValidator();
    
    if(document.getElementById('email').value.length > 0){
        validateEmail();
    }
    if(document.getElementById('password').value.length > 0){
        validatePassword();
    }
});