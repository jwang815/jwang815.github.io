    // ========== Hero Slideshow ==========
    (function() {
      const slides = document.querySelectorAll('.hero-slide');
      let current = 0;
      const total = slides.length;

      function nextSlide() {
        slides[current].classList.remove('active');
        // Reset scale for exiting slide
        slides[current].querySelector('img').style.transform = 'scale(1.05)';
        current = (current + 1) % total;
        slides[current].classList.add('active');
      }

      setInterval(nextSlide, 6000);
    })();

    // ========== Navigation Scroll ==========
    (function() {
      const nav = document.getElementById('mainNav');
      let ticking = false;

      window.addEventListener('scroll', function() {
        if (!ticking) {
          requestAnimationFrame(function() {
            if (window.scrollY > 80) {
              nav.classList.add('scrolled');
            } else {
              nav.classList.remove('scrolled');
            }
            ticking = false;
          });
          ticking = true;
        }
      });
    })();

    // ========== Mobile Menu ==========
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    function closeMobileMenu() {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }

    // ========== Scroll Reveal (IntersectionObserver) ==========
    (function() {
      const reveals = document.querySelectorAll('.reveal');

      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      reveals.forEach(function(el) {
        // Don't observe hero content — it's already visible
        if (!el.closest('.hero')) {
          observer.observe(el);
        }
      });
    })();

    // ========== Parallax Hero ==========
    (function() {
      const hero = document.getElementById('hero');
      const heroContent = hero.querySelector('.hero-content');
      let ticking = false;

      window.addEventListener('scroll', function() {
        if (!ticking) {
          requestAnimationFrame(function() {
            const scrolled = window.scrollY;
            const heroHeight = hero.offsetHeight;
            if (scrolled < heroHeight) {
              const parallaxAmount = scrolled * 0.35;
              const opacityReduction = 1 - (scrolled / heroHeight) * 0.6;
              heroContent.style.transform = 'translateY(' + parallaxAmount + 'px)';
              heroContent.style.opacity = Math.max(opacityReduction, 0);
            }
            ticking = false;
          });
          ticking = true;
        }
      });
    })();

    // ========== Smooth anchor scrolling ==========
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const navHeight = document.getElementById('mainNav').offsetHeight;
          const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
      });
    });

    // ========== Testimonial Carousel ==========
    (function() {
      var track = document.getElementById('testimonialTrack');
      var slides = track.querySelectorAll('.testimonial-slide');
      var prevBtn = document.getElementById('testimonialPrev');
      var nextBtn = document.getElementById('testimonialNext');
      var dotsContainer = document.getElementById('testimonialDots');
      var currentIndex = 0;
      var totalSlides = slides.length;
      var autoPlayInterval = null;
      var isDragging = false;
      var startX = 0;
      var currentTranslate = 0;
      var dragDelta = 0;

      // Create dots
      for (var i = 0; i < totalSlides; i++) {
        var dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        dot.dataset.index = i;
        dot.addEventListener('click', function() {
          goToSlide(parseInt(this.dataset.index));
          resetAutoPlay();
        });
        dotsContainer.appendChild(dot);
      }

      function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        currentTranslate = -currentIndex * 100;
        track.style.transform = 'translateX(' + currentTranslate + '%)';
        track.classList.remove('dragging');
        // Update dots
        var dots = dotsContainer.querySelectorAll('.testimonial-dot');
        for (var j = 0; j < dots.length; j++) {
          dots[j].classList.toggle('active', j === currentIndex);
        }
      }

      // Arrow handlers
      prevBtn.addEventListener('click', function() {
        goToSlide(currentIndex - 1);
        resetAutoPlay();
      });
      nextBtn.addEventListener('click', function() {
        goToSlide(currentIndex + 1);
        resetAutoPlay();
      });

      // Touch/swipe support
      track.addEventListener('mousedown', startDrag);
      track.addEventListener('touchstart', startDrag, { passive: true });
      track.addEventListener('mousemove', onDrag);
      track.addEventListener('touchmove', onDrag, { passive: false });
      track.addEventListener('mouseup', endDrag);
      track.addEventListener('mouseleave', endDrag);
      track.addEventListener('touchend', endDrag);

      function startDrag(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        dragDelta = 0;
        track.classList.add('dragging');
      }

      function onDrag(e) {
        if (!isDragging) return;
        var x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        dragDelta = x - startX;
        var pct = (dragDelta / track.offsetWidth) * 100;
        track.style.transform = 'translateX(' + (currentTranslate + pct) + '%)';
        if (e.type === 'touchmove' && Math.abs(dragDelta) > 10) {
          e.preventDefault();
        }
      }

      function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('dragging');
        var threshold = track.offsetWidth * 0.15;
        if (dragDelta < -threshold) {
          goToSlide(currentIndex + 1);
        } else if (dragDelta > threshold) {
          goToSlide(currentIndex - 1);
        } else {
          goToSlide(currentIndex);
        }
        resetAutoPlay();
      }

      // Auto-play
      function startAutoPlay() {
        autoPlayInterval = setInterval(function() {
          goToSlide(currentIndex + 1);
        }, 6000);
      }
      function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
      }
      startAutoPlay();

      // Keyboard support
      document.addEventListener('keydown', function(e) {
        var testimonialSection = document.getElementById('testimonial');
        var rect = testimonialSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          if (e.key === 'ArrowLeft') { goToSlide(currentIndex - 1); resetAutoPlay(); }
          if (e.key === 'ArrowRight') { goToSlide(currentIndex + 1); resetAutoPlay(); }
        }
      });
    })();

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = this.parentElement;
        var wasActive = item.classList.contains('active');
        // Close all
        document.querySelectorAll('.faq-item.active').forEach(function(el) {
          el.classList.remove('active');
        });
        // Toggle clicked
        if (!wasActive) item.classList.add('active');
      });
    });
