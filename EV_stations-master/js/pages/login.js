document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    AOS.init({
        duration: 800,
        easing: 'ease-in-out'
    });

    // Password visibility toggle
    document.querySelector('.password-toggle').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // Simple password validation
    document.getElementById('password').addEventListener('input', function() {
        const passwordReq = document.getElementById('passwordRequirements');
        if (this.value.length > 0) {
            passwordReq.classList.remove('d-none');
            
            // Check for password requirements
            const hasUppercase = /[A-Z]/.test(this.value);
            const hasLowercase = /[a-z]/.test(this.value);
            const hasNumber = /[0-9]/.test(this.value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(this.value);
            
            if (hasUppercase && hasLowercase && hasNumber && hasSpecial) {
                passwordReq.classList.add('text-success');
                passwordReq.classList.remove('text-secondary');
            } else {
                passwordReq.classList.remove('text-success');
                passwordReq.classList.add('text-secondary');
            }
        } else {
            passwordReq.classList.add('d-none');
        }
    });
}); 

// backend begains

async function userlogin(event) {
    event.preventDefault(); // Prevent the default form submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/v1/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("userData", JSON.stringify(data.data));
            alert('Login successful! Redirecting...');
            window.location.href = 'http://127.0.0.1:5500/index.html'; // Redirect to dashboard or another page
        } else {
            alert(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    }

}


