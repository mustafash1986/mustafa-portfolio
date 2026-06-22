/* ==========================================================================
   INTERACTIVE SCRIPTS - PORTFOLIO FOR MUSTAFA MAHMOUD SHAWKY
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- 1. STICKY HEADER & SCROLL ACTIVE SECTION --- */
  const header = document.getElementById('header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    // Header shadow on scroll
    if (window.scrollY > 50) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }

    // Nav active state based on scroll section
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });


  /* --- 2. MOBILE NAVIGATION MENU --- */
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navList = document.getElementById('nav-links');

  mobileToggle.addEventListener('click', () => {
    navList.classList.toggle('active');
    mobileToggle.classList.toggle('active');
  });

  // Close mobile nav on link click
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('active');
      mobileToggle.classList.remove('active');
    });
  });


  /* --- 3. ENTRANCE REVEAL ON SCROLL --- */
  const reveals = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });

  reveals.forEach(element => {
    revealObserver.observe(element);
  });


  /* --- 4. SKILL BAR ANIMATION ON VIEW --- */
  const skillBars = document.querySelectorAll('.skill-bar-fill');
  
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const percent = entry.target.getAttribute('data-percent');
        entry.target.style.width = percent;
        skillObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.5
  });

  skillBars.forEach(bar => {
    skillObserver.observe(bar);
  });


  /* --- 5. INTERACTIVE PORTFOLIO BOOK SLIDER --- */
  const slides = document.getElementById('book-slides');
  const prevBtn = document.getElementById('book-prev');
  const nextBtn = document.getElementById('book-next');
  const counter = document.getElementById('book-counter');
  const titleText = document.getElementById('book-slide-title');
  const thumbs = document.querySelectorAll('.book-thumb');
  const zoomBtn = document.getElementById('book-zoom');
  const fullscreenBtn = document.getElementById('book-fullscreen');
  const bookViewport = document.getElementById('book-viewport');
  
  const lightbox = document.getElementById('portfolio-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  let currentSlide = 0;
  const totalSlides = thumbs.length;

  // Custom descriptive titles for the 23 portfolio pages
  const slideTitles = [
    "Portfolio Cover Sheet - Cover Page",
    "Executive Professional Design Summary",
    "Kuwait University Health Sciences Center - Allied Health Building Layout",
    "Learning Resource Centre - Master Site Coordination Structure",
    "Allied Health Building - Key Structural Detailing & Construction Plan",
    "KUHSC Allied Health Building - Grid Intersection Layout",
    "Learning Resource Centre - Spatial Planning & Room Allocations",
    "Learning Resource Centre - Sectional Elevations & Detailed Facades",
    "Kuwait Gulf Oil Company (KGOC) HQ - Corporate Site Coordination Layout",
    "KGOC HQ - Grand Entrance Atrium Detailed Steel Structure",
    "KGOC HQ - Interior Workspace Floor Layout & Spatial Partitions",
    "Dubai Iconic Tower - Structural Core Clearances Review Sheet",
    "Dubai Iconic Tower - Detailed Curtain Wall Construction Detailing",
    "Mubarak Al Abdullah Joint Staff College - Architectural Blueprint",
    "Typical Institutional Kindergarten - Ground Layout & Safe Spaces Plans",
    "Typical School - Structural Clearances & Structural Masonry Layouts",
    "National Guard Clinic - Medical Wing Layouts & Interior Spatial Plan",
    "Islamic Center & Mosque - Traditional Arched Geometric Blueprint",
    "Dubai Creek Harbour Mosque - Structural Vault Sectional Detail",
    "Kuwait Olympic Village - Regional Civic Center Competition Drawing",
    "Kuwait Digital Startup Campus - Eco-Efficient Ventilation Master Plan",
    "High-End Private Villa - Custom Executive Residential Floorplans",
    "Bespoke Residential Compound - Master Site Allocation Layout"
  ];

  function updateBook() {
    // Translate slides
    slides.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update counter
    counter.textContent = `Page ${currentSlide + 1} / ${totalSlides}`;
    
    // Update caption
    titleText.textContent = slideTitles[currentSlide] || `Portfolio Sheet ${currentSlide + 1}`;
    
    // Update active thumbnail
    thumbs.forEach((thumb, idx) => {
      if (idx === currentSlide) {
        thumb.classList.add('active');
        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  // Next/Prev click handlers
  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateBook();
  });

  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateBook();
  });

  // Thumbnail click handlers
  thumbs.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => {
      currentSlide = idx;
      updateBook();
    });
  });

  // Keyboard navigation for portfolio book
  document.addEventListener('keydown', (e) => {
    // Only trigger if portfolio section is visible in window view
    const rect = bookViewport.getBoundingClientRect();
    const isVisible = (rect.top < window.innerHeight && rect.bottom >= 0);
    
    if (isVisible) {
      if (e.key === 'ArrowRight') {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateBook();
      } else if (e.key === 'ArrowLeft') {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateBook();
      }
    }
  });

  // Lightbox Zoom Logic
  zoomBtn.addEventListener('click', () => {
    const activeSlideImg = slides.children[currentSlide].querySelector('img');
    if (activeSlideImg) {
      lightboxImg.src = activeSlideImg.src;
      lightboxImg.alt = activeSlideImg.alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Lock scrolling
    }
  });

  // Close Lightbox
  lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scrolling
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Fullscreen Mode Logic
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      bookViewport.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });


  /* --- 6. PROJECTS CATEGORY FILTERING --- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          // Smooth fade-in
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          // Delay display change to match animation timing
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });


  /* --- 7. CONTACT FORM HANDLER --- */
  const contactForm = document.getElementById('contact-form');
  const feedbackMessage = document.getElementById('form-feedback-message');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset feedback
    feedbackMessage.style.display = 'none';
    feedbackMessage.className = 'form-feedback';

    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const subject = document.getElementById('form-subject').value.trim();
    const message = document.getElementById('form-message').value.trim();

    // Check basic validation
    if (!name || !email || !subject || !message) {
      showFeedback('Please fill in all fields before sending.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showFeedback('Please enter a valid email address.', 'error');
      return;
    }

    // Since this is a static site on GitHub Pages, we can simulate email sending
    // or direct them to Mailto. To provide a professional user experience,
    // we show a success message and then draft a mailto pre-filled string as a fallback.
    
    showFeedback('Preparing your email client... Sending message details.', 'success');
    
    setTimeout(() => {
      // Create mailto link details
      const mailtoLink = `mailto:Mustafa_arch07@yahoo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Hello Mustafa,\n\n" + message + "\n\nRegards,\n" + name + " (" + email + ")")}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      showFeedback('Message draft opened in your email client! Thank you for getting in touch.', 'success');
      contactForm.reset();
    }, 1200);
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showFeedback(text, status) {
    feedbackMessage.textContent = text;
    feedbackMessage.classList.add(status);
    feedbackMessage.style.display = 'block';
  }

});
