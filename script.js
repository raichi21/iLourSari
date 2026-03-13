const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');

passwordToggle.addEventListener('click', function() {
    const isPassword = passwordInput.type === 'password';
    
    passwordInput.type = isPassword ? 'text' : 'password';
            
    const icon = this.querySelector('i');
    if (isPassword) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
});

document.getElementById('loginForm').addEventListener('submit', function(e) {

    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // simple login validation 
    if(email === "admin@isar" && password === "admin123"){
        
        // redirect to dashboard
        window.location.href = "dashboard.html";

    }else{
        alert("Invalid email or password");
    }

});