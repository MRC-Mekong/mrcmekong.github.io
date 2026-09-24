(() => {
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const progressFill = document.getElementById('progressFill');
  const navLinks = document.querySelectorAll('[data-nav]');
  const backToTopBtn = document.getElementById('backToTop');

  /* ---------- Explore button: centered between hero headline and info bar ---------- */
  const hero = document.querySelector('.hero');
  const heroHeadline = document.querySelector('.hero-headline');
  const heroExplore = document.getElementById('heroExplore');
  const heroInfobar = document.getElementById('heroInfobar');
  function positionHeroExplore() {
    if (!hero || !heroHeadline || !heroExplore || !heroInfobar) return;
    const heroTop = hero.getBoundingClientRect().top;
    const headlineBottom = heroHeadline.getBoundingClientRect().bottom - heroTop;
    const infobarTop = heroInfobar.getBoundingClientRect().top - heroTop;
    const exploreHeight = heroExplore.offsetHeight;
    const midpoint = headlineBottom + (infobarTop - headlineBottom) / 2;
    heroExplore.style.top = Math.max(0, midpoint - exploreHeight / 2) + 'px';
  }
  positionHeroExplore();
  window.addEventListener('resize', positionHeroExplore);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(positionHeroExplore);
  }
  // Re-measure after the reveal-on-scroll transform (translateY) settles,
  // since measuring mid-transition bakes in a stale offset.
  [heroHeadline, heroExplore, heroInfobar].forEach(el => {
    if (el) el.addEventListener('transitionend', positionHeroExplore);
  });
  setTimeout(positionHeroExplore, 1200);

  /* ---------- River divider: fades in smoothly as it scrolls into view ---------- */
  const riverDivider = document.getElementById('riverDivider');
  const riverImg = document.getElementById('riverImg');
  if (riverDivider && riverImg) {
    function updateRiver() {
      const rect = riverDivider.getBoundingClientRect();
      const vh = window.innerHeight;
      let progress = (vh - rect.top) / (vh + rect.height);
      progress = Math.min(1, Math.max(0, progress));
      riverImg.style.opacity = progress * 0.5;
    }
    updateRiver();
    window.addEventListener('scroll', updateRiver, { passive: true });
    window.addEventListener('resize', updateRiver);
  }

  /* ---------- River caption: types in once the divider is in view ---------- */
  const riverCaptionClip = document.getElementById('riverCaptionClip');
  const riverCaption = document.getElementById('riverCaption');
  if (riverCaptionClip && riverCaption) {
    function fitCaptionSize() {
      const containerWidth = riverDivider.clientWidth;
      const targetWidth = Math.min(containerWidth * 0.86, 1116) * 0.9;
      riverCaption.style.fontSize = '16px';
      const baseWidth = riverCaption.scrollWidth;
      const newSize = Math.max(16, 16 * (targetWidth / baseWidth));
      riverCaption.style.fontSize = newSize + 'px';
    }
    function measureCaption() {
      fitCaptionSize();
      riverCaptionClip.style.setProperty('--caption-w', riverCaption.scrollWidth + 'px');
    }
    measureCaption();
    window.addEventListener('resize', measureCaption);
    const captionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          measureCaption();
          riverCaptionClip.classList.add('is-typing');
          captionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    captionObserver.observe(riverCaptionClip);
  }

  /* ---------- Header scroll state + scroll progress ---------- */
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (backToTopBtn) backToTopBtn.classList.toggle('is-visible', y > window.innerHeight * 0.8);

    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const pct = scrollable > 0 ? (y / scrollable) * 100 : 0;
    progressFill.style.width = pct + '%';
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('is-open');
    header.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  mainNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      header.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Reveal-on-scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // Safety net: a fast scroll (Page Down, trackpad flick) can move an element
  // from "below the fold" to "above the fold" between frames, so the
  // IntersectionObserver never sees it intersect and it stays hidden forever.
  // Catch anything that has already been scrolled past and reveal it instantly.
  let revealSweepQueued = false;
  function sweepPassedReveals() {
    revealSweepQueued = false;
    document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        if (rect.bottom < 0) el.classList.add('is-visible');
      }
    });
  }
  document.addEventListener('scroll', () => {
    if (!revealSweepQueued) {
      revealSweepQueued = true;
      requestAnimationFrame(sweepPassedReveals);
    }
  }, { passive: true });

  /* ---------- Scroll-spy active nav link ---------- */
  const navSections = [
    { id: 'hero', href: '#top' },
    { id: 'programme', href: '#dayProgramme' },
    { id: 'venue', href: '#venue' },
    { id: 'media', href: '#media' },
    { id: 'faq', href: '#faq' }
  ];

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const match = navSections.find(s => s.id === entry.target.id);
        if (!match) return;
        navLinks.forEach(link => {
          link.classList.toggle('is-active', link.getAttribute('href') === match.href);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navSections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) spyObserver.observe(el);
  });

  /* ---------- Hero countdown to opening (2 Apr 2027, Bangkok time UTC+7) ---------- */
  const heroCountdown = document.getElementById('heroCountdown');
  if (heroCountdown) {
    const opening = new Date('2027-04-02T00:00:00+07:00').getTime();
    const cdDays = heroCountdown.querySelector('[data-cd="d"]');
    const cdHours = heroCountdown.querySelector('[data-cd="h"]');
    const cdMins = heroCountdown.querySelector('[data-cd="m"]');
    const cdSecs = heroCountdown.querySelector('[data-cd="s"]');
    function pad(n) { return String(n).padStart(2, '0'); }
    function tickCountdown() {
      const diff = Math.max(opening - Date.now(), 0);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      cdDays.textContent = pad(days);
      cdHours.textContent = pad(hours);
      cdMins.textContent = pad(mins);
      cdSecs.textContent = pad(secs);
    }
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- Count-up stats ---------- */
  const stats = document.querySelectorAll('.stat[data-count]');
  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const numEl = el.querySelector('.stat-num');
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      numEl.textContent = Math.floor(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else numEl.textContent = target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(el => statsObserver.observe(el));

  /* ---------- Venue Map: isometric plan + programme by room ---------- */
  const MARKERS = [
    { no: 1,  x: 90.93, y: 41.82 },
    { no: 2,  x: 79.63, y: 53.91 },
    { no: 3,  x: 60.48, y: 65.57 },
    { no: 4,  x: 63.48, y: 69.37 },
    { no: 5,  x: 72.95, y: 71.05 },
    { no: 6,  x: 70.92, y: 73.04 },
    { no: 7,  x: 69.06, y: 75.10 },
    { no: 8,  x: 67.00, y: 77.34 },
    { no: 9,  x: 62.65, y: 81.58 },
    { no: 10, x: 60.32, y: 83.95 },
    { no: 11, x: 58.49, y: 85.76 },
    { no: 12, x: 56.40, y: 88.32 },
    { no: 13, x: 54.37, y: 84.39 },
    { no: 14, x: 36.16, y: 79.71 },
    { no: 15, x: 33.57, y: 76.85 },
    { no: 16, x: 31.01, y: 67.81 },
    { no: 17, x: 24.93, y: 74.29 }
  ];

  const MAP_IMAGES = {
    1: { src: 'assets/floorplans/day1.html', title: 'Day 1 venue floor plan' },
    2: { src: 'assets/floorplans/day2.html', title: 'Day 2 venue floor plan' }
  };

  const VENUE_DAYS = {
    1: {
      markers: {
        1: { title: 'Lunch & Dinner', room: 'Plenary Hall 3', cap: '', rows: [] },
        2: { title: 'Plenary Session', room: 'Plenary Hall 2 / Plenary Hall 1', cap: '200 participants', rows: [
          { t: '09:00', s: 'Welcome Session' },
          { t: '09:25', s: 'Conference Objective and Structure' },
          { t: '09:30', s: 'Opening Sessions: Mekong Developments, Challenges, and Opportunities' },
          { t: '10:50', s: 'Summary of Keynotes' },
          { t: '11:00', s: 'Visit to Conference Exhibition' },
          { t: '13:30', s: '1A: “Advancing Water Flow and Hydropower Coordination”' },
          { t: '15:30', s: '1D: Youth-led Riverpreneur Business Idea Challenge' }
        ] },
        3: { title: '1B – 1E', room: 'Room 111C – 110C', cap: '200 participants', rows: [
          { t: '13:30', s: '1B: “Enhancing Data, Monitoring, and Modelling Capabilities for Decision Support”' },
          { t: '15:30', s: '1E: “Advancing Community Innovations for River Livelihoods”' }
        ] },
        4: { title: '1C – 1F', room: 'Room 111B – 110A', cap: '200 participants', rows: [
          { t: '13:30', s: '1C: “Empowering Communities through Citizen Science”' },
          { t: '15:30', s: '1F: In Conversation – The Water Leaders’ Table' }
        ] },
        5: { title: 'Side Event', room: 'Room 120', cap: '100 participants', rows: [{ t: '12:00', s: 'Programme to be confirmed' }] },
        6: { title: 'Private Room', room: '', cap: '', rows: [] },
        7: { title: 'Private Room', room: '', cap: '', rows: [] },
        8: { title: 'Side Event', room: 'Room 117', cap: '100 participants', rows: [{ t: '12:00', s: 'Programme to be confirmed · TNMCs' }] },
        9: { title: 'Delegates Room', room: 'Room 116 · TNMCs', cap: '100 participants', rows: [] },
        10: { title: 'Delegates Room', room: 'Room 115 · CNMCs', cap: '100 participants', rows: [] },
        11: { title: 'Delegates Room', room: 'Room 114 · VNMCs', cap: '100 participants', rows: [] },
        12: { title: 'Delegates Room', room: 'Room 112 · LNMCs', cap: '100 participants', rows: [] },
        13: { title: 'Coffee Break Area 1', room: 'Room C102', cap: '100 participants', rows: [] },
        14: { title: 'Organiser Room', room: 'Room 107A-B · MRCs', cap: '100 participants', rows: [] },
        15: { title: 'Organiser Room', room: 'Room 106 · TNMCs', cap: '100 participants', rows: [] },
        16: { title: 'Media Room', room: 'Room 105', cap: '100 participants', rows: [] },
        17: { title: 'Coffee Break Area 2', room: 'Room C101', cap: '100 participants', rows: [] }
      }
    },
    2: {
      markers: {
        1: { title: 'Lunch & Dinner', room: 'Plenary Hall 3', cap: '', rows: [] },
        2: { title: 'Plenary Session', room: 'Plenary Hall 2 / Plenary Hall 1', cap: '200 participants', rows: [
          { t: '09:00', s: 'Summary of Day One and Opening of Day Two' },
          { t: '09:15', s: '2A: Digital Twin Technology for Transboundary River Management · Plenary Hall 1' },
          { t: '11:00', s: 'Reflections on the International Conference and Ways Forward' },
          { t: '12:00', s: 'Conference Key Messages and Closing Session' }
        ] },
        3: { title: '2B', room: 'Room 111C – 110C', cap: '200 participants', rows: [
          { t: '09:15', s: '2B: Smart Agriculture, Aquaculture, and Water Quality' }
        ] },
        4: { title: '2C', room: 'Room 111B – 110A', cap: '200 participants', rows: [
          { t: '13:00', s: 'Programme to be confirmed' }
        ] },
        5: { title: 'Side Event', room: 'Room 120', cap: '100 participants', rows: [
          { t: '12:00', s: 'Mekong Youth Innovation Showcase Exhibition' },
          { t: '', s: 'Community Knowledge Marketplace featuring tools, local products, and resilience stories' },
          { t: '', s: 'Sister River Dialogue with other basin organisations' }
        ] },
        6: { title: 'Private Room', room: '', cap: '', rows: [] },
        7: { title: 'Private Room', room: '', cap: '', rows: [] },
        8: { title: 'Side Event', room: 'Room 117 · TNMCs', cap: '100 participants', rows: [{ t: '12:00', s: 'Programme to be confirmed' }] },
        9: { title: 'Delegates Room', room: 'Room 116 · TNMCs', cap: '100 participants', rows: [] },
        10: { title: 'Delegates Room', room: 'Room 115 · CNMCs', cap: '100 participants', rows: [] },
        11: { title: 'Delegates Room', room: 'Room 114 · VNMCs', cap: '100 participants', rows: [] },
        12: { title: 'Delegates Room', room: 'Room 112 · LNMCs', cap: '100 participants', rows: [] },
        13: { title: 'Coffee Break Area 1', room: 'Room C102', cap: '100 participants', rows: [] },
        14: { title: 'Organiser Room', room: 'Room 107A-B · MRCs', cap: '100 participants', rows: [] },
        15: { title: 'Organiser Room', room: 'Room 106 · TNMCs', cap: '100 participants', rows: [] },
        16: { title: 'Media Room', room: 'Room 105', cap: '100 participants', rows: [] },
        17: { title: 'Coffee Break Area 2', room: 'Room C101', cap: '100 participants', rows: [] }
      }
    }
  };

  const venueTabs = document.querySelectorAll('.venue-tab');
  const venueLive = document.getElementById('venueLive');
  const venueSoon = document.getElementById('venueSoon');
  const venueDayHeading = document.getElementById('venueDayHeading');
  const venueRoomList = document.getElementById('venueRoomList');
  const venueFloorplanFrame = document.getElementById('venueFloorplanFrame');
  const mapLightboxFrame = document.getElementById('mapLightboxFrame');
  const downloadMapBtn = document.getElementById('downloadMapBtn');
  const MAP_PDFS = {
    1: { href: 'assets/venue-map-day1.pdf', filename: '5th-MRC-Summit-Venue-Map-Day-1.pdf' },
    2: { href: 'assets/venue-map-day2.pdf', filename: '5th-MRC-Summit-Venue-Map-Day-2.pdf' }
  };
  let currentVenueDay = 1;

  function sessionsHtml(rows) {
    if (!rows || !rows.length) return '<p class="fp-empty">No sessions scheduled.</p>';
    return rows.map(r => `
      <div class="venue-session">
        <span class="venue-session-time">${r.t || ''}</span>
        <div class="venue-session-body">
          <p class="venue-session-title">${r.s}</p>
        </div>
      </div>`).join('');
  }

  function renderRoomList(day) {
    const data = VENUE_DAYS[day];
    if (!venueRoomList || !data) return;
    venueRoomList.innerHTML = MARKERS.map(m => {
      const info = data.markers[m.no];
      if (!info || !info.rows.length) return '';
      return `
        <div class="venue-room-group" data-room-group="m${m.no}">
          <h4>${info.room || info.title}</h4>
          ${sessionsHtml(info.rows)}
        </div>`;
    }).join('');
  }

  function setVenueDay(day) {
    currentVenueDay = day;
    const mapImg = MAP_IMAGES[day];
    if (mapImg) {
      if (venueFloorplanFrame && venueFloorplanFrame.getAttribute('src') !== mapImg.src) {
        venueFloorplanFrame.src = mapImg.src;
        venueFloorplanFrame.title = mapImg.title;
      }
      if (mapLightboxFrame && mapLightboxFrame.getAttribute('src') !== mapImg.src) {
        mapLightboxFrame.src = mapImg.src;
        mapLightboxFrame.title = mapImg.title + ', zoomed in';
      }
    }
    if (VENUE_DAYS[day]) {
      if (venueLive) venueLive.hidden = false;
      if (venueSoon) venueSoon.hidden = true;
      if (venueDayHeading) venueDayHeading.textContent = `Day ${day} Programme by Room`;
      renderRoomList(day);
    } else {
      if (venueLive) venueLive.hidden = true;
      if (venueSoon) venueSoon.hidden = false;
    }
    if (downloadMapBtn) {
      const pdf = MAP_PDFS[day];
      if (pdf) {
        downloadMapBtn.href = pdf.href;
        downloadMapBtn.setAttribute('download', pdf.filename);
        downloadMapBtn.textContent = `Download Day ${day} Map (PDF)`;
        downloadMapBtn.classList.remove('is-disabled');
        downloadMapBtn.removeAttribute('aria-disabled');
      } else {
        downloadMapBtn.removeAttribute('href');
        downloadMapBtn.removeAttribute('download');
        downloadMapBtn.textContent = `Day ${day} Map Coming Soon`;
        downloadMapBtn.classList.add('is-disabled');
        downloadMapBtn.setAttribute('aria-disabled', 'true');
      }
    }
  }

  venueTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      venueTabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      setVenueDay(parseInt(tab.getAttribute('data-day'), 10));
    });
  });

  setVenueDay(1);

  /* ---------- Badge circles: tap to reveal on touch devices ---------- */
  document.querySelectorAll('.badge-circle').forEach(circle => {
    circle.addEventListener('click', () => {
      const isActive = circle.classList.contains('is-active');
      document.querySelectorAll('.badge-circle').forEach(c => c.classList.remove('is-active'));
      if (!isActive) circle.classList.add('is-active');
    });
  });

  /* ---------- Responsive floor plan embeds: scale fixed-size iframes to fit their container ---------- */
  const floorplanEmbeds = Array.from(document.querySelectorAll('.floorplan-embed'));
  function scaleFloorplanEmbed(embed) {
    const iframe = embed.querySelector('iframe');
    if (!iframe) return;
    const nativeW = parseFloat(embed.getAttribute('data-native-w'), 10);
    const nativeH = parseFloat(embed.getAttribute('data-native-h'), 10);
    const containerW = embed.getBoundingClientRect().width;
    if (!nativeW || !nativeH || !containerW) return;
    const scale = containerW / nativeW;
    iframe.style.width = nativeW + 'px';
    iframe.style.height = nativeH + 'px';
    iframe.style.transform = `scale(${scale})`;
    embed.style.height = (nativeH * scale) + 'px';
  }
  function scaleAllFloorplanEmbeds() {
    floorplanEmbeds.forEach(scaleFloorplanEmbed);
  }
  if (floorplanEmbeds.length) {
    scaleAllFloorplanEmbeds();
    window.addEventListener('resize', scaleAllFloorplanEmbeds);
    venueTabs.forEach(tab => tab.addEventListener('click', () => setTimeout(scaleAllFloorplanEmbeds, 0)));
  }

  /* ---------- Venue map zoom lightbox ---------- */
  const mapZoomBtn = document.getElementById('mapZoomBtn');
  const mapLightbox = document.getElementById('mapLightbox');
  const mapLightboxClose = document.getElementById('mapLightboxClose');
  if (mapZoomBtn && mapLightbox) {
    mapZoomBtn.addEventListener('click', () => {
      mapLightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    });
    const closeLightbox = () => {
      mapLightbox.hidden = true;
      document.body.style.overflow = '';
    };
    if (mapLightboxClose) mapLightboxClose.addEventListener('click', closeLightbox);
    mapLightbox.addEventListener('click', e => {
      if (e.target === mapLightbox) closeLightbox();
    });
  }

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!isOpen) item.classList.add('is-open');
    });
  });

  /* ---------- Smooth-scroll offset for sticky header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const headerH = header.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - (headerH - 10);
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
