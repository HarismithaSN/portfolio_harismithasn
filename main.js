// AOS Initialization
AOS.init({
    duration: 800,
    offset: 100,
    easing: 'ease-out-cubic',
    once: true
});

// Custom Cursor (Preserved)
const cursorDot = document.querySelector('.cursor-dot');
const cursorCircle = document.querySelector('.cursor-circle');

document.addEventListener('mousemove', (e) => {
    cursorDot.style.left = `${e.clientX}px`;
    cursorDot.style.top = `${e.clientY}px`;

    // Magnetic lag for circle
    cursorCircle.animate({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`
    }, { duration: 500, fill: "forwards" });
});

// Hover Effect for Cursor
const hoverElements = document.querySelectorAll('a, .btn-box, .project-card, .metric-card, .magnetic-btn, .dev-toggle');

hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorCircle.style.width = '60px';
        cursorCircle.style.height = '60px';
        cursorCircle.style.backgroundColor = 'rgba(34, 211, 238, 0.1)';
        cursorCircle.style.borderColor = 'transparent';
    });
    el.addEventListener('mouseleave', () => {
        cursorCircle.style.width = '40px';
        cursorCircle.style.height = '40px';
        cursorCircle.style.backgroundColor = 'transparent';
        cursorCircle.style.borderColor = '#22D3EE';
    });
});

// Skill Bars Animation
const skillBars = document.querySelectorAll('.skill-fill');
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const targetWidth = bar.getAttribute('data-width');
            bar.style.width = targetWidth;
            skillObserver.unobserve(bar);
        }
    });
}, { threshold: 0.5 });
skillBars.forEach(bar => {
    skillObserver.observe(bar);
});


// --- ADVANCED BACKGROUND SYSTEM (Dual Mode) ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let bgMode = 'stars'; // 'stars' or 'matrix'
let animationFrameId;

// Resize
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (bgMode === 'stars') initStars();
    if (bgMode === 'matrix') initMatrix();
}
window.addEventListener('resize', resize);


// --- MODE 1: STARS (Parallax & Twinkle) ---
let stars = [];
let mouse = { x: 0, y: 0 };

const starLayers = [
    { count: 150, speed: 0.1, size: 0.8, color: "rgba(255,255,255,0.3)" }, // Deep Space (Tiny/Slow)
    { count: 80, speed: 0.3, size: 1.5, color: "rgba(0, 245, 255, 0.4)" }, // Midground (Cyan)
    { count: 40, speed: 0.6, size: 2.5, color: "rgba(123, 97, 255, 0.7)", twinkle: true }  // Foreground (Purple/Twinkle)
];

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function initStars() {
    stars = [];
    starLayers.forEach((layer, layerIndex) => {
        for (let i = 0; i < layer.count; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                baseX: Math.random() * width,
                baseY: Math.random() * height,
                size: Math.random() * layer.size,
                speed: layer.speed,
                layer: layerIndex,
                color: layer.color,
                twinkle: layer.twinkle || false,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    });
}

function animateStars() {
    ctx.clearRect(0, 0, width, height);

    // Parallax Offset
    const centerX = width / 2;
    const centerY = height / 2;
    const parallaxX = (mouse.x - centerX) * 0.05;
    const parallaxY = (mouse.y - centerY) * 0.05;

    stars.forEach(star => {
        star.y -= star.speed * 0.2;
        if (star.y < 0) {
            star.y = height;
            star.x = Math.random() * width;
        }

        const layerFactor = (star.layer + 1) * 0.5;
        const currentX = star.x - (parallaxX * layerFactor);
        const currentY = star.y - (parallaxY * layerFactor);

        // Twinkle Effect
        let alpha = 1;
        if (star.twinkle) {
            star.twinklePhase += 0.05;
            alpha = 0.5 + Math.abs(Math.sin(star.twinklePhase)) * 0.5;
        }

        ctx.beginPath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = star.color;
        ctx.arc(currentX, currentY, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset
    });

    // Constellation lines logic removed for cleaner "Deep Space" look per request for "Real Universe"
}




// --- MODE 2: MATRIX RAIN (Dev Mode) ---
let columns;
let drops = [];
const fontSize = 14;

function initMatrix() {
    columns = Math.floor(width / fontSize);
    drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * height; // Random start positions
    }
}

function animateMatrix() {
    // Semi-transparent black to create trail effect
    ctx.fillStyle = "rgba(2, 6, 23, 0.1)";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#22D3EE"; // Neon Cyan
    ctx.font = fontSize + "px 'JetBrains Mono'";

    for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}


// --- MASTER LOOP ---
function animate() {
    if (bgMode === 'stars') {
        animateStars();
    } else if (bgMode === 'matrix') {
        animateMatrix();
    }
    animationFrameId = requestAnimationFrame(animate);
}

// Initial Start
resize();
animate();


// --- TOGGLE SYSTEM ---
const devToggle = document.getElementById('dev-toggle');
if (devToggle) {
    devToggle.addEventListener('click', () => {
        if (bgMode === 'stars') {
            bgMode = 'matrix';
            initMatrix();
            devToggle.classList.add('active');
            devToggle.innerHTML = '<i class="fa-solid fa-code"></i> System: Active';
        } else {
            bgMode = 'stars';
            initStars();
            devToggle.classList.remove('active');
            devToggle.innerHTML = '<i class="fa-solid fa-terminal"></i> Dev Mode';
        }
    });
}


// --- MAGNETIC BUTTONS ---
const magneticBtns = document.querySelectorAll('.magnetic-btn');

magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px) scale(1)';
    });

    btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.95)';
    });
});

// Mobile Menu Toggle
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

if (menuIcon) {
    menuIcon.onclick = () => {
        menuIcon.classList.toggle('bx-x');
        navbar.classList.toggle('active');
    }
}

// Scroll Sections
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
                let activeLink = document.querySelector('header nav a[href*=' + id + ']');
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            });
        };
    });
    let header = document.querySelector('header');
    header.classList.toggle('sticky', window.scrollY > 100);
    if (menuIcon) {
        menuIcon.classList.remove('bx-x');
        if (navbar) navbar.classList.remove('active');
    }
};


// --- PROJECT PLANET MODAL SYSTEM ---
const projectData = {
    'resume': {
        title: 'AI Resume Analyzer',
        tags: 'Python | NLP | Streamlit',
        desc: 'An intelligent system that parses resumes, extracts key skills, and matches them with job descriptions using Natural Language Processing. Features include candidacy scoring and keyword optimization suggestions.',
        link: '#'
    },
    'diabetes': {
        title: 'Diabetes Prediction System',
        tags: 'Machine Learning | Scikit-Learn | Flask',
        desc: 'A healthcare diagnostic tool achieving 80% accuracy in early diabetes detection. Utilizes Logistic Regression on the Kaggle health dataset to analyze patient metrics and predict risk factors.',
        link: '#'
    },
    'kidapp': {
        title: 'KidApp Ecosystem',
        tags: 'Gamification | Interactive UI | EdTech',
        desc: 'A comprehensive educational platform for children featuring interactive learning modules, gamified quizzes, and a "Safe Zone" content filter. Designed to make early learning engaging and secure.',
        link: '#'
    }
};

window.openProject = function (id) {
    const modal = document.getElementById('project-modal');
    const data = projectData[id];

    if (data) {
        document.getElementById('modal-title').innerText = data.title;
        document.getElementById('modal-tags').innerText = data.tags;
        document.getElementById('modal-desc').innerText = data.desc;
        document.getElementById('modal-link').href = data.link;

        modal.classList.add('active');

        // Optional: Blur background
        document.querySelector('.home').style.filter = 'blur(5px)';
        document.querySelector('.portfolio').style.filter = 'blur(5px)';
    }
};

window.closeModal = function () {
    document.getElementById('project-modal').classList.remove('active');
    document.querySelector('.home').style.filter = 'none';
    document.querySelector('.portfolio').style.filter = 'none';
};
// --- CONTACT FORM TRANSMISSION SYSTEM ---
// --- CONTACT FORM TRANSMISSION SYSTEM ---
window.sendTransmission = async function (event) {
    event.preventDefault();

    // Get button and original text for feedback
    const btn = event.target.querySelector('button');
    const btnSpan = btn.querySelector('span');
    const originalText = btn.getAttribute('data-original-text') || btnSpan.innerText;
    if (!btn.getAttribute('data-original-text')) {
        btn.setAttribute('data-original-text', originalText);
    }

    // Show Loading State
    btnSpan.innerText = "Transmitting...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    const name = document.getElementById('name-field').value;
    const email = document.getElementById('email-field').value;
    const message = document.getElementById('message-field').value;

    // Configuration for EmailJS (Replace these with your actual IDs)
    const serviceID = "service_qag1rvo";
    const templateID = "template_0bf4fwp";

    let transmissionSuccess = false;

    try {
        // STRATEGY 1: Try EmailJS (Serverless)
        // Check if keys are configured (simple check to see if they are still defaults)
        if (serviceID !== "YOUR_SERVICE_ID" && templateID !== "YOUR_TEMPLATE_ID") {
            console.log("Attempting transmission via EmailJS...");
            await emailjs.send(serviceID, templateID, {
                from_name: name,
                from_email: email,
                message: message,
                to_name: "Harismitha", // Optional, depends on your template
            });
            console.log("EmailJS transmission successful.");
            transmissionSuccess = true;
        } else {
            console.log("EmailJS not configured. Skipping to local server...");
        }
    } catch (emailJsError) {
        console.warn("EmailJS failed:", emailJsError);
        // Continue to Strategy 2
    }

    if (!transmissionSuccess) {
        try {
            // STRATEGY 2: Try Local Backend Server
            console.log("Attempting transmission via Local Server...");
            const response = await fetch('http://127.0.0.1:5000/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Local Server transmission successful.");
                transmissionSuccess = true;
            } else {
                throw new Error(data.error || 'Server error');
            }
        } catch (serverError) {
            console.warn("Local Server failed:", serverError);
            // Continue to Strategy 3
        }
    }

    if (transmissionSuccess) {
        // Success Logic
        btnSpan.innerText = "Signal Received!";
        btn.style.borderColor = "var(--accent-cyan)";
        btn.style.color = "var(--accent-cyan)";
        event.target.reset();

        // Reset Button after delay
        setTimeout(() => {
            btnSpan.innerText = originalText;
            btn.style.borderColor = "";
            btn.style.color = "";
            btn.style.opacity = "1";
            btn.disabled = false;
        }, 4000);

    } else {
        // STRATEGY 3: Final Fallback to Mailto
        console.log("All automatic transmissions failed. engaging manual backup.");
        btnSpan.innerText = "Using Backup Channel...";
        btn.style.borderColor = "#ff4444";
        btn.style.color = "#ff4444";

        setTimeout(() => {
            const subject = `Portfolio Transmission from ${name}`;
            const body = `Commander Name: ${name}%0D%0AFrequency (Email): ${email}%0D%0A%0D%0ATransmission Message:%0D%0A${message}`;
            window.location.href = `mailto:harismithasn@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;

            // Reset after mailto opens
            setTimeout(() => {
                btnSpan.innerText = originalText;
                btn.style.borderColor = "";
                btn.style.color = "";
                btn.style.opacity = "1";
                btn.disabled = false;
            }, 2000);
        }, 1000);
    }
};
