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
    { id: 'programme', href: '#programme' },
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

  /* ---------- Venue Map: floor plan + programme by room ---------- */
  const ROOM_META = [
    { id: 'plenary-2', label: 'Plenary Hall 2' },
    { id: 'plenary-1', label: 'Plenary Hall 1' },
    { id: 'room-b', label: 'Room 111C–110C' },
    { id: 'room-c', label: 'Room 111B–110A' },
    { id: 'room-120', label: 'Room 120 — Side Event' }
  ];

  const VENUE_DAYS = {
    1: {
      rooms: {
        'plenary-2': [
          { time: '09:00', title: 'Welcome Session', people: ['Chairperson, Thai National Mekong Committee (TBC)', 'Mr Chadchart Sittipunt, Governor of Bangkok', 'Ms Busadee Santipitaks, CEO, MRC Secretariat'] },
          { time: '09:25', title: 'Conference Objective and Structure', people: ['Ms Khemupsorn Sirisukha, Master of Ceremony'] },
          { time: '09:30', title: 'Opening Sessions: Mekong Developments, Challenges and Opportunities', people: ['Keynote 1: Prof. Taikan Oki, University of Tokyo & 2024 Stockholm Water Prize Laureate', 'Keynote 2: Niklas Ruf & Jana Spiller, Stockholm Junior Water Prize 2025', 'Keynote 3: Ms Retno Marsudi, UN Secretary-General’s Special Envoy on Water', 'Keynote 4: Ms Busadee Santipitaks, CEO, MRC Secretariat'] },
          { time: '10:50', title: 'Summary of Keynotes', people: ['Ms Khemupsorn Sirisukha'] },
          { time: '11:00', title: 'Visit to Conference Exhibition', people: [] }
        ],
        'plenary-1': [
          { time: '13:30', title: 'Session 1A — “Advancing Water Flow and Hydropower Coordination”', people: ['Facilitator: Australia/DFAT', 'Rapporteurs: MRCS staff'] },
          { time: '15:30', title: 'Session 1D — “Youth-led Riverpreneur Business Idea Challenge”', people: ['Facilitator: MRCS', 'Rapporteurs: MRCS staff'] }
        ],
        'room-b': [
          { time: '13:30', title: 'Session 1B — “Enhancing Data, Monitoring, and Modelling Capabilities for Decision Support”', people: ['Facilitator: USACE', 'Rapporteurs: MRCS staff'] },
          { time: '15:30', title: 'Session 1E — “Advancing Community Innovations for River Livelihoods”', people: ['Facilitator: WWF', 'Rapporteurs: MRCS staff'] }
        ],
        'room-c': [
          { time: '13:30', title: 'Session 1C — “Empowering Communities through Citizen Science”', people: ['Facilitator: SEI', 'Rapporteurs: MRCS staff'] },
          { time: '15:30', title: 'Session 1F — “In Conversation: The Water Leaders’ Table”', people: ['Facilitator: GIZ', 'Rapporteurs: MRCS staff', 'With leaders from MRC, NBI, OVMS, CWRC and NDBA'] }
        ],
        'room-120': [
          { time: '12:00', title: 'Side Event', people: ['Programme to be confirmed'] }
        ]
      }
    },
    2: {
      rooms: {
        'plenary-2': [
          { time: '09:00', title: 'Summary of Day One and Opening of Day Two', people: ['Facilitator: Ms Khemupsorn Sirisukha'] },
          { time: '11:00', title: 'Plenary: Reflections on the International Conference and Ways Forward', people: ['Facilitator: Ms Khemupsorn Sirisukha', 'Speakers: Development Partners, Youth, Community & Partner Organization Representatives'] },
          { time: '12:00', title: 'Conference Key Messages and Closing Session', people: ['Ms Busadee Santipitaks, CEO, MRC Secretariat', 'Closing remarks: Joint Committee Chair'] }
        ],
        'plenary-1': [
          { time: '09:15', title: 'Session 2A — “Digital Twin Technology for Transboundary River Management”', people: ['Facilitator: UNOSSC (STEPI, K-Water)', 'Rapporteurs: MRCS staff'] }
        ],
        'room-b': [
          { time: '09:15', title: 'Session 2B — “Smart Agriculture, Aquaculture, and Water Quality”', people: ['Facilitator: MAFF/JICA', 'Rapporteurs: MRCS staff'] }
        ],
        'room-c': [
          { time: '13:00', title: 'Session 2C', people: ['Programme to be confirmed'] }
        ],
        'room-120': [
          { time: '12:00', title: 'Side Event', people: ['Mekong Youth Innovation Showcase Exhibition', 'Community Knowledge Marketplace', 'Sister River Dialogue with other basin organisations'] }
        ]
      }
    }
  };

  const venueTabs = document.querySelectorAll('.venue-tab');
  const venueLive = document.getElementById('venueLive');
  const venueSoon = document.getElementById('venueSoon');
  const venueDayHeading = document.getElementById('venueDayHeading');
  const venueRoomList = document.getElementById('venueRoomList');
  const fpWrap = document.getElementById('fpWrap');
  const fpTooltip = document.getElementById('fpTooltip');
  let currentVenueDay = 1;

  function sessionsHtml(sessions) {
    if (!sessions || !sessions.length) return '<p class="fp-empty">No sessions scheduled.</p>';
    return sessions.map(s => `
      <div class="venue-session">
        <span class="venue-session-time">${s.time}</span>
        <div class="venue-session-body">
          <p class="venue-session-title">${s.title}</p>
          ${s.people.length ? `<ul class="venue-session-people">${s.people.map(p => `<li>${p}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`).join('');
  }

  function renderRoomList(day) {
    const data = VENUE_DAYS[day];
    if (!venueRoomList || !data) return;
    venueRoomList.innerHTML = ROOM_META.map(room => {
      const sessions = data.rooms[room.id];
      if (!sessions) return '';
      return `
        <div class="venue-room-group" data-room-group="${room.id}">
          <h4>${room.label}</h4>
          ${sessionsHtml(sessions)}
        </div>`;
    }).join('');
  }

  function showTooltip(roomEl) {
    const day = VENUE_DAYS[currentVenueDay];
    if (!day || !fpTooltip || !fpWrap) return;
    const roomId = roomEl.getAttribute('data-room');
    const sessions = day.rooms[roomId];
    if (!sessions) return;
    const meta = ROOM_META.find(r => r.id === roomId);

    fpTooltip.innerHTML = `<h5>${meta ? meta.label : ''}</h5>${sessionsHtml(sessions)}`;
    fpTooltip.hidden = false;

    const wrapRect = fpWrap.getBoundingClientRect();
    const roomRect = roomEl.getBoundingClientRect();
    let left = roomRect.left - wrapRect.left + roomRect.width / 2;
    let top = roomRect.top - wrapRect.top + roomRect.height + 10;

    fpTooltip.style.left = '0px';
    fpTooltip.style.top = '0px';
    const tipRect = fpTooltip.getBoundingClientRect();
    left = Math.max(8, Math.min(left - tipRect.width / 2, wrapRect.width - tipRect.width - 8));
    if (top + tipRect.height > wrapRect.height) {
      top = roomRect.top - wrapRect.top - tipRect.height - 10;
    }
    fpTooltip.style.left = left + 'px';
    fpTooltip.style.top = top + 'px';

    document.querySelectorAll('.venue-room-group').forEach(g => {
      g.classList.toggle('is-highlighted', g.getAttribute('data-room-group') === roomId);
    });
  }

  function hideTooltip() {
    if (!fpTooltip) return;
    fpTooltip.hidden = true;
    document.querySelectorAll('.venue-room-group').forEach(g => g.classList.remove('is-highlighted'));
  }

  document.querySelectorAll('.fp-room').forEach(room => {
    room.addEventListener('mouseenter', () => showTooltip(room));
    room.addEventListener('mouseleave', hideTooltip);
    room.addEventListener('focus', () => showTooltip(room));
    room.addEventListener('blur', hideTooltip);
    room.addEventListener('click', () => showTooltip(room));
  });

  function setVenueDay(day) {
    currentVenueDay = day;
    hideTooltip();
    if (VENUE_DAYS[day]) {
      if (venueLive) venueLive.hidden = false;
      if (venueSoon) venueSoon.hidden = true;
      if (venueDayHeading) venueDayHeading.textContent = `Day ${day} Programme by Room`;
      renderRoomList(day);
    } else {
      if (venueLive) venueLive.hidden = true;
      if (venueSoon) venueSoon.hidden = false;
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
