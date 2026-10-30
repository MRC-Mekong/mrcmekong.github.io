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

  /* ---------- Venue Map: interactive floor plans + programme by room ---------- */
  // Three views per day: full floor plan plus two zoomed close-ups
  const MAP_VIEWS = {
    full:  { suffix: '',       label: 'floor plan',                    w: 1832, h: 1920 },
    halls: { suffix: '-halls', label: 'Plenary Halls & Exhibition',    w: 1488, h: 1600 },
    rooms: { suffix: '-rooms', label: 'Meeting Rooms & Services',      w: 1324, h: 1716 }
  };
  const MAP_DAYS = [1, 2];

  // Programme by room, from the 5th MRC International Conference agenda (draft, 19 Oct 2026)
  const VENUE_DAYS = {
    1: [
      { room: 'Plenary Hall 1 & 2 · Plenary Session', rows: [
        { t: '08:00', s: 'Registration' },
        { t: '09:00', s: 'Welcome Session', p: [
          'Setting the scene cultural performance',
          'Welcome remarks: Ms. Busadee Santipitaks, Chief Executive Officer, Mekong River Commission Secretariat',
          'Welcome remarks: Mr. Chadchart Sittipunt, Governor of Bangkok',
          'Opening remarks: Chairperson of the Thai National Mekong Committee, Member of the MRC Council for Thailand'
        ] },
        { t: '09:35', s: 'Conference Objective and Structure' },
        { t: '09:40', s: 'Opening Sessions: Mekong Developments, Challenges, and Opportunities', p: [
          'Keynote 1: From the UN Water Action Agenda to Mekong Action – Ms. Retno Marsudi, UN Special Envoy on Water',
          'Keynote 2: Science to Solutions: Advancing Basin Management Through Data, Models, and Policy – Professor Kaveh Madani, United Nations University',
          'Keynote 3: Youth’s Perspectives on Climate, Health, and River Resilience – Moroti Adegboyega, Winner of the Stockholm Junior Water Prize 2026',
          'Keynote 4: Growing Together and Stronger for People, Partnership and Prosperity in the Mekong River Basin – Ms. Busadee Santipitaks, CEO, MRCS'
        ] },
        { t: '10:50', s: 'Summary of keynotes' },
        { t: '13:30', s: 'MRC Beyond 2030: What Will a Self-Financing MRC Look Like?', p: [
          'Panel: MRC Joint Committee Members for Cambodia, Lao PDR, Thailand and Viet Nam; CEO, MRCS; Regional Head of Project, Germany',
          'Moderator: Dr. Susanne Schmeier'
        ] }
      ] },
      { room: 'Plenary Hall 1', rows: [
        { t: '14:10', s: '1A: Community Knowledge and Action for Climate and Livelihood Resilience' },
        { t: '15:30', s: '2A: Mekong Game Lab: Solving Development Challenges Through Games' }
      ] },
      { room: 'Plenary Hall 2', rows: [
        { t: '14:10', s: '1B: Inclusive Cooperation and Engagement on Water Infrastructure Development' },
        { t: '15:30', s: '2B: In Conversation – The Water Leaders’ Table' }
      ] },
      { room: 'Meeting Room 1', rows: [
        { t: '14:10', s: '1C: Empowering Communities through Citizen Science' },
        { t: '15:30', s: '2C: Monitoring the Mekong Together: From Data to Action' }
      ] },
      { room: 'Meeting Room 2', rows: [
        { t: '14:10', s: '1D: Enhancing Data, Monitoring, and Modelling Capabilities for Decision Support' },
        { t: '15:30', s: '2D: Advancing Water Flow and Hydropower Coordination for Sustainable Energy Cooperation' }
      ] },
      { room: 'Exhibition Hall', rows: [
        { t: '11:00', s: 'Visit to Conference Exhibition', p: [
          'Brief tour for the Minister, Governor and Joint Committee Members, led by Ms. Busadee Santipitaks, CEO, MRCS'
        ] }
      ] },
      { room: 'Plenary Hall 3 · Lunch and Dinner', rows: [
        { t: '', s: 'Lunch Break' }
      ] }
    ],
    2: [
      { room: 'Plenary Hall 1', rows: [
        { t: '09:00', s: 'Summary of Day One and Opening of Day Two, and Setting the Scene for Day Two' },
        { t: '09:30', s: '3A: Smart Agriculture, Aquaculture, and Water Quality' },
        { t: '11:00', s: 'Plenary Session: Reflections on the International Conference and Ways Forward', p: [
          'Facilitator: Dr. Susanne Schmeier',
          'Speakers: DPs, Youth (Mekong River Basin), Community and Partner Organization Representatives'
        ] },
        { t: '12:00', s: 'Conference Key Messages and Closing Session', p: [
          'Key messages to the Ministerial Meeting and the Summit: Ms. Busadee Santipitaks, CEO, MRCS',
          'Closing remarks: Joint Committee Chair'
        ] }
      ] },
      { room: 'Plenary Hall 2', rows: [
        { t: '09:30', s: '3B: Youth-led Riverpreneur Challenge: Business Idea Pitch (Shark Tank) · 9:30–11:30' }
      ] },
      { room: 'Meeting Room 1', rows: [
        { t: '09:30', s: '3C: From Nexus Thinking to Nexus Action: Solutions for the Mekong' }
      ] },
      { room: 'Meeting Room 2', rows: [
        { t: '09:30', s: '3D: Through the Lens: Youth Stories of the Mekong' }
      ] },
      { room: 'Coffee Break Areas', rows: [
        { t: '10:30', s: 'Coffee break' }
      ] },
      { room: 'Exhibition Hall', rows: [
        { t: '', s: 'Exhibitions and Activities', p: [
          'Mekong Youth Innovation Showcase Exhibition',
          'Community Knowledge Marketplace featuring tools, local products, and resilience stories',
          'Photo Booths',
          'Interactive Games',
          'Water Quality in Action: Test, Analyze and Understand'
        ] }
      ] },
      { room: 'Room 120 · Side Event', rows: [
        { t: '12:00', s: 'Sister River Dialogue with other basin organizations (Bilateral meeting)' }
      ] },
      { room: 'Room 117 · Side Event', rows: [
        { t: '12:00', s: 'MOU signing' }
      ] }
    ]
  };

  const venueTabs = document.querySelectorAll('.venue-tab');
  const venueViews = document.querySelectorAll('.venue-view');
  const venueLive = document.getElementById('venueLive');
  const venueSoon = document.getElementById('venueSoon');
  const venueDayHeading = document.getElementById('venueDayHeading');
  const venueRoomList = document.getElementById('venueRoomList');
  const venueFloorplanEmbed = document.getElementById('venueFloorplanEmbed');
  const venueFloorplanFrame = document.getElementById('venueFloorplanFrame');
  const mapLightboxFrame = document.getElementById('mapLightboxFrame');
  const downloadMapBtn = document.getElementById('downloadMapBtn');
  const MAP_PDFS = {
    1: { href: 'assets/venue-map-day1.pdf', filename: '5th-MRC-Summit-Venue-Map-Day-1.pdf' },
    2: { href: 'assets/venue-map-day2.pdf', filename: '5th-MRC-Summit-Venue-Map-Day-2.pdf' }
  };
  let currentVenueDay = 1;
  let currentVenueView = 'full';

  function sessionsHtml(rows) {
    if (!rows || !rows.length) return '<p class="fp-empty">No sessions scheduled.</p>';
    return rows.map(r => `
      <div class="venue-session">
        <span class="venue-session-time">${r.t || ''}</span>
        <div class="venue-session-body">
          <p class="venue-session-title">${r.s}</p>
          ${r.p ? `<ul class="venue-session-people">${r.p.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`).join('');
  }

  function renderRoomList(day) {
    const rooms = VENUE_DAYS[day];
    if (!venueRoomList || !rooms) return;
    venueRoomList.innerHTML = rooms.map(g => `
      <div class="venue-room-group">
        <h4>${g.room}</h4>
        ${sessionsHtml(g.rows)}
      </div>`).join('');
  }

  function showMap(day, view) {
    if (MAP_DAYS.indexOf(day) < 0) return;
    const v = MAP_VIEWS[view];
    const src = `assets/floorplans/day${day}${v.suffix}.html`;
    const title = `Day ${day} ${v.label}`;
    if (venueFloorplanEmbed) {
      venueFloorplanEmbed.setAttribute('data-native-w', v.w);
      venueFloorplanEmbed.setAttribute('data-native-h', v.h);
    }
    if (venueFloorplanFrame && venueFloorplanFrame.getAttribute('src') !== src) {
      venueFloorplanFrame.src = src;
      venueFloorplanFrame.title = title;
    }
    if (mapLightboxFrame) {
      mapLightboxFrame.style.width = v.w + 'px';
      mapLightboxFrame.style.height = v.h + 'px';
      if (mapLightboxFrame.getAttribute('src') !== src) {
        mapLightboxFrame.src = src;
        mapLightboxFrame.title = title + ', zoomed in';
      }
    }
    if (venueFloorplanEmbed) scaleFloorplanEmbed(venueFloorplanEmbed);
  }

  function setVenueView(view) {
    currentVenueView = view;
    venueViews.forEach(b => {
      const on = b.getAttribute('data-view') === view;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    showMap(currentVenueDay, view);
  }

  function setVenueDay(day) {
    currentVenueDay = day;
    showMap(day, currentVenueView);
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
  venueViews.forEach(b => b.addEventListener('click', () => setVenueView(b.getAttribute('data-view'))));

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
