    const authBtn = document.getElementById("authBtn");

    function updateButton() {
      const isLoggedIn = localStorage.getItem("userData") !== null;
      authBtn.textContent = isLoggedIn ? "Logout" : "Login";

      authBtn.onclick = function () {
        if (isLoggedIn) {
            localStorage.removeItem("userData");
            authBtn.textContent = "Login";
            alert("Logged out successfully!");
        } else {
            window.location.href = "http://127.0.0.1:5500/login.html"; // Redirect to login page
        }
        updateButton();
      };
    }

    updateButton();

document.addEventListener('DOMContentLoaded', function() {
    // ===== Navbar Animation =====
    const navbar = document.querySelector('.navbar');

    
    function adjustNavbar() {
        if (window.scrollY > 50 || window.innerWidth < 992) {
            navbar.classList.add('scrolled');
            navbar.style.padding = '0.5rem 1.5rem';
        } else {
            navbar.classList.remove('scrolled');
            navbar.style.padding = '1rem 2rem';
        }
    }
    
    // Initial call to adjust navbar based on current position/width
    adjustNavbar();
    
    // Adjust navbar on scroll or resize
    window.addEventListener('scroll', adjustNavbar);
    window.addEventListener('resize', adjustNavbar);
    
    // ===== Smooth Scrolling =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') !== "#") {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    // Get navbar height for offset
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active nav link
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('active');
                    });
                    this.classList.add('active');
                    
                    // Close mobile navbar if open
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.getElementById('navbarNav');
                    if (navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                }
            }
        });
    });
    
    // ===== Refresh Logo Animation =====
    const logoLink = document.querySelector('.navbar-brand');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Animate logo icon
            const logoIcon = this.querySelector('i');
            logoIcon.style.transition = 'transform 0.8s ease';
            logoIcon.style.transform = 'rotate(360deg)';
            
            // Smooth scroll to top first
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Then reload after scroll completes
            setTimeout(() => {
                window.location.reload();
            }, 800);
        });
    }
    
    // ===== Mobile Touch Feedback =====
    const actionButtons = document.querySelectorAll('.btn, .nav-link, .social-link');
    actionButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // ===== Image Lazy Loading =====
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
    
    // ===== Responsive Hero Height =====
    const adjustHeroHeight = () => {
        const hero = document.querySelector('.hero');
        if (hero) {
            if (window.innerWidth < 768) {
                hero.style.minHeight = 'calc(100vh - 80px)';
            } else {
                hero.style.minHeight = '100vh';
            }
        }
    };
    
    adjustHeroHeight();
    window.addEventListener('resize', adjustHeroHeight);
    
    // ===== Stats Counter Animation =====
    const animateStats = () => {
        document.querySelectorAll('.stat-number').forEach(stat => {
            const targetValue = parseInt(stat.getAttribute('data-count') || stat.textContent);
            let currentValue = 0;
            const increment = targetValue / 50; // Controls animation speed
            const duration = 1500; // Total animation duration in ms
            const stepTime = duration / (targetValue / increment);
            
            // Add data-symbol attribute if it exists on the element
            const symbol = stat.getAttribute('data-symbol') || '';
            
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= targetValue) {
                    stat.textContent = targetValue.toLocaleString();
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(currentValue).toLocaleString();
                }
                
                // Append symbol if exists
                if (symbol) {
                    stat.setAttribute('data-symbol', symbol);
                }
            }, stepTime);
        });
    };
    
    // ===== Intersection Observer for Animations =====
    const observeElements = (elements, callback, options = {}) => {
        const defaultOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const mergedOptions = {...defaultOptions, ...options};
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, mergedOptions);
        
        elements.forEach(element => {
            observer.observe(element);
        });
    };
    
    // Animate stats when in view
    observeElements(document.querySelectorAll('.stats'), () => {
        animateStats();
    });
    
    // Add animation classes to elements when scrolled into view
    const addAnimationClass = (element) => {
        element.classList.add('animated-in');
    };
    
    // Add custom animations to feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Add custom animations to testimonial cards
    document.querySelectorAll('.testimonial-card').forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // ===== Floating Elements Animation =====
    const floatingElements = document.querySelectorAll('.floating');
    floatingElements.forEach(element => {
        // Randomize animation delay to create natural effect
        const delay = Math.random() * 2;
        element.style.animationDelay = `${delay}s`;
    });
    
    // ===== Navbar Active State on Scroll =====
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function highlightNavOnScroll() {
        const scrollPosition = window.scrollY + navbar.offsetHeight + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavOnScroll);
    
    // ===== Mousemove Parallax Effect =====
    const heroSection = document.querySelector('.hero');
    if (heroSection && window.innerWidth > 992) {
        heroSection.addEventListener('mousemove', (e) => {
            const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
            const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
            
            const heroImg = document.querySelector('.hero-img');
            if (heroImg) {
                heroImg.style.transform = `perspective(1000px) rotateY(${xPos * 0.2}deg) rotateX(${-yPos * 0.1}deg) translateZ(10px)`;
            }
        });
        
        heroSection.addEventListener('mouseleave', () => {
            const heroImg = document.querySelector('.hero-img');
            if (heroImg) {
                heroImg.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
            }
        });
    }
}); 