document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animation library
    AOS.init({
        duration: 800,
        easing: 'ease-in-out'
    });

    // Password visibility toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
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
    });

    // Password validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordRequirements = document.getElementById('passwordRequirements');
    const passwordMatch = document.getElementById('passwordMatch');
    const registerForm = document.getElementById('registerForm');
    
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    
    function validatePassword() {
        const value = passwordInput.value;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecial && value.length >= 8;

        // Show or hide password requirement feedback
        togglePasswordFeedback(valid, { hasUpperCase, hasLowerCase, hasNumber, hasSpecial });
        return valid;
    }
    
    function togglePasswordFeedback(valid, { hasUpperCase, hasLowerCase, hasNumber, hasSpecial }) {
        const requirements = {
            uppercase: hasUpperCase,
            lowercase: hasLowerCase,
            number: hasNumber,
            special: hasSpecial,
            length: passwordInput.value.length >= 8
        };

        for (let [key, value] of Object.entries(requirements)) {
            const element = document.getElementById(key);
            if (value) {
                element.classList.add('text-success');
                element.classList.remove('text-danger');
            } else {
                element.classList.add('text-danger');
                element.classList.remove('text-success');
            }
        }

        passwordRequirements.classList.toggle('d-none', valid);
    }

    function checkPasswordMatch() {
        const passwordValue = passwordInput.value;
        const confirmValue = confirmPasswordInput.value;
        
        if (confirmValue) {
            passwordMatch.classList.remove('d-none');
            if (passwordValue === confirmValue) {
                passwordMatch.textContent = 'Passwords match';
                passwordMatch.classList.add('text-success');
                passwordMatch.classList.remove('text-danger');
                return true;
            } else {
                passwordMatch.textContent = 'Passwords do not match';
                passwordMatch.classList.add('text-danger');
                passwordMatch.classList.remove('text-success');
                return false;
            }
        } else {
            passwordMatch.classList.add('d-none');
            return false;
        }
    }
    
    registerForm.addEventListener('submit', function(e) {
        const isPasswordValid = validatePassword();
        const doPasswordsMatch = checkPasswordMatch();
        
        if (!isPasswordValid || !doPasswordsMatch) {
            e.preventDefault();
            alert('Please correct the errors in the form before submitting.');
        }
    });
});


// Backend begains

async function handleClick(event) {
    event.preventDefault(); // Stop default form submission

    // Collecting all form input values
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    if ( password != confirmPassword) {
        alert("Passwords do not match");
        return;
    } 
    if (!terms) {
        alert("You must accept the terms and conditions.");
        return;
    }

    // Constructing the object
    const userData = {
      firstName,
      lastName,
      email,
      phone,
      password
    };

    console.log("Sending user data to backend:", userData);

    try {
      const response = await fetch('http://localhost:3000/api/v1/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        alert("Account created successfully!");
        window.location.href = "http://127.0.0.1:5500/login.html"; // Redirect if needed
      } else {
        alert(result.error || "Something went wrong");
      }

    } catch (error) {
      console.error("Error while registering:", error);
      alert("Failed to connect to the server.");
    }
  }