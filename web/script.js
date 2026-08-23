// ==========================================================================
// BUZZLY CHAT - LANDING PAGE INTERACTIVE SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Navbar Scroll Effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      if (navLinks.style.display === 'flex') {
        navLinks.style.position = 'absolute';
        navLinks.style.top = '70px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.flexDirection = 'column';
        navLinks.style.background = 'rgba(8, 12, 20, 0.95)';
        navLinks.style.padding = '20px';
        navLinks.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      }
    });
  }

  // FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(el => el.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Animated Statistics Counters
  const counterElements = document.querySelectorAll('[data-counter]');
  let animated = false;

  const animateCounters = () => {
    counterElements.forEach(el => {
      const target = parseInt(el.getAttribute('data-counter'), 10);
      if (isNaN(target)) return;

      let current = 0;
      const step = Math.max(1, Math.floor(target / 40));
      const suffix = el.textContent.includes('%') ? '%' : (el.textContent.includes('<') ? '<50ms' : '+');

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        if (suffix === '<50ms') {
          el.textContent = `<${current}ms`;
        } else if (suffix === '%') {
          el.textContent = `${current}%`;
        } else {
          el.textContent = `${current.toLocaleString()}+`;
        }
      }, 30);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateCounters();
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    observer.observe(statsSection);
  }

  // Live Chat Simulation Demo in Hero Section
  const chatDemoContainer = document.getElementById('live-chat-demo');
  if (chatDemoContainer) {
    const demoMessages = [
      { sender: 'S', name: 'Shinji', text: 'Hey there! Greetings from Tokyo 🗼', type: 'received' },
      { sender: 'You', name: 'You', text: 'Hey! Awesome to connect instantly!', type: 'sent' },
      { sender: 'S', name: 'Shinji', text: 'What anime are you currently watching?', type: 'received' },
      { sender: 'You', name: 'You', text: 'Chainsaw Man! Love the action 🔥', type: 'received_reply' }
    ];

    let msgIndex = 2;
    setInterval(() => {
      if (msgIndex < demoMessages.length) {
        const msgData = demoMessages[msgIndex];
        const msgDiv = document.createElement('div');
        msgDiv.className = `mockup-msg ${msgData.type === 'received_reply' ? 'sent' : 'received'}`;
        msgDiv.innerHTML = `
          <div class="mockup-avatar">${msgData.type === 'received_reply' ? 'You' : 'S'}</div>
          <div class="mockup-bubble">${msgData.text}</div>
        `;
        chatDemoContainer.appendChild(msgDiv);
        msgIndex++;
      }
    }, 4000);
  }
});
