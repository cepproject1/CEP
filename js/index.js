// ===================================
// Smooth Scrolling
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') {
            return;
        }

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// Navbar Scroll Effect
// ===================================
const navbar = document.querySelector('.navbar');

const updateNavbarState = () => {
    if (!navbar) return;

    if (window.scrollY > 24) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
};

updateNavbarState();
window.addEventListener('scroll', updateNavbarState);

// ===================================
// Mobile Menu Toggle
// ===================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// ===================================
// Scroll Animations (AOS-like)
// ===================================
const animateOnScroll = () => {
    const elements = document.querySelectorAll('[data-aos]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
};

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', animateOnScroll);
} else {
    animateOnScroll();
}

// ===================================
// Counter Animation for Stats
// ===================================
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
};

const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString();
};

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const statValue = entry.target.querySelector('strong');
            const text = statValue.textContent;
            
            // Extract number from text
            let targetNumber;
            if (text.includes('K+')) {
                targetNumber = parseFloat(text.replace('K+', '')) * 1000;
            } else if (text.includes('M+')) {
                targetNumber = parseFloat(text.replace('M+', '')) * 1000000;
            } else if (text.includes('★')) {
                targetNumber = parseFloat(text.replace('★', ''));
                statValue.textContent = '0★';
                animateRating(statValue, targetNumber);
                entry.target.classList.add('animated');
                return;
            } else {
                targetNumber = parseInt(text.replace(/\D/g, ''));
            }
            
            animateCounter(statValue, targetNumber);
            entry.target.classList.add('animated');
        }
    });
}, { threshold: 0.5 });

const animateRating = (element, target) => {
    let current = 0;
    const increment = target / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toFixed(1) + '★';
            clearInterval(timer);
        } else {
            element.textContent = current.toFixed(1) + '★';
        }
    }, 20);
};

// Observe all stats
document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// ===================================
// Chart Animation
// ===================================
const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            // Add animated class to trigger CSS animations
            entry.target.classList.add('animated');
        }
    });
}, { threshold: 0.3 });

const chartContainer = document.querySelector('.chart-bars');
if (chartContainer) {
    chartObserver.observe(chartContainer);
}

// Add hover effect to chart bars
document.querySelectorAll('.bar-fill').forEach(bar => {
    bar.addEventListener('mouseenter', function() {
        const value = this.parentElement.querySelector('.bar-value');
        if (value) {
            value.style.color = 'var(--primary-color)';
            value.style.fontWeight = '700';
        }
    });
    
    bar.addEventListener('mouseleave', function() {
        const value = this.parentElement.querySelector('.bar-value');
        if (value) {
            value.style.color = 'var(--text-dark)';
            value.style.fontWeight = '600';
        }
    });
});

// ===================================
// Parallax Effect for Hero
// ===================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image');
    
    if (heroImage && scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// ===================================
// Form Validation (if you add a newsletter form)
// ===================================
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ===================================
// Add loading animation
// ===================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ===================================
// Floating Cards Animation Enhancement
// ===================================
document.querySelectorAll('.floating-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.1)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
    });
});

// ===================================
// Feature Cards Hover Effect
// ===================================
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.borderColor = 'var(--primary-color)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.borderColor = 'var(--border-color)';
    });
});

// ===================================
// Testimonial Cards Auto-rotation (Optional)
// ===================================
let testimonialIndex = 0;
const testimonials = document.querySelectorAll('.testimonial-card');

const rotateTestimonials = () => {
    if (testimonials.length === 0) return;
    
    testimonials.forEach((testimonial, index) => {
        if (index === testimonialIndex) {
            testimonial.style.transform = 'scale(1.05)';
            testimonial.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.2)';
        } else {
            testimonial.style.transform = 'scale(1)';
            testimonial.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
    });
    
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
};

// Rotate testimonials every 5 seconds
setInterval(rotateTestimonials, 5000);

// ===================================
// Button Click Effects
// ===================================
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            left: ${x}px;
            top: ${y}px;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// Lazy Loading Images (if you add more images)
// ===================================
const lazyImages = document.querySelectorAll('img[data-src]');

const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.add('loaded');
            observer.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// ===================================
// Scroll Progress Indicator
// ===================================
const createScrollProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        width: 0%;
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
};

createScrollProgress();

// ===================================
// Console Easter Egg
// ===================================
console.log('%c🎉 Welcome to NutriScan!', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cInterested in how this was built? Check out the code!', 'font-size: 14px; color: #764ba2;');
console.log('%c✨ Made with ❤️ by GitHub Copilot', 'font-size: 12px; color: #4a5568;');

// ===================================
// Performance Optimization
// ===================================
// Debounce function for scroll events
const debounce = (func, wait = 10) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Apply debounce to scroll-heavy operations
const debouncedScroll = debounce(() => {
    // Heavy scroll operations here
}, 10);

window.addEventListener('scroll', debouncedScroll);