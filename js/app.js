import { getQuoteByIndex, getQuoteCount, getQuoteSummary } from './data/quotes.js';
import {
  detectLocale,
  getMessages,
  getSupportedLocales,
  saveLocale,
  translate,
} from './i18n/index.js';

const PORTRAIT_SRC = 'bg.png';

const SILHOUETTE_SVG = [
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'>",
  '<defs>',
  "<linearGradient id='gold' x1='0' y1='0' x2='0' y2='1'>",
  "<stop offset='0%' stop-color='#f8e7ae'/><stop offset='58%' stop-color='#d4a017'/><stop offset='100%' stop-color='#8f5b00'/>",
  '</linearGradient>',
  "<radialGradient id='bg' cx='50%' cy='35%' r='75%'>",
  "<stop offset='0%' stop-color='#6b1b1b'/><stop offset='100%' stop-color='#260808'/>",
  '</radialGradient>',
  '</defs>',
  "<rect width='120' height='140' rx='10' fill='url(#bg)'/>",
  "<circle cx='60' cy='70' r='44' fill='#ffffff0e'/>",
  "<g stroke='#f0d06033' stroke-width='2' stroke-linecap='round'>",
  "<path d='M60 10v10'/><path d='M24 28l8 6'/><path d='M96 28l-8 6'/><path d='M18 64h10'/><path d='M102 64H92'/>",
  '</g>',
  "<path fill='url(#gold)' d='M60 18c16 0 30 10 35 24 4 1 8 5 8 11 0 5-2 9-6 11 1 3 2 7 2 10 0 9-4 18-11 25 14 6 24 17 28 33H4c4-16 14-27 28-33-7-7-11-16-11-25 0-3 1-7 2-10-4-2-6-6-6-11 0-6 4-10 8-11 5-14 19-24 35-24z'/>",
  "<path fill='#8f5b00' opacity='.38' d='M28 44c10-9 21-13 32-13 12 0 23 4 32 13-8 3-19 5-32 5-13 0-24-2-32-5z'/>",
  "<path fill='#fff2c4' opacity='.18' d='M44 58c4-8 11-12 20-12 7 0 14 2 19 7-6 2-12 3-19 3-8 0-15-1-20-3z'/>",
  '</svg>',
].join('');

const SILHOUETTE_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(SILHOUETTE_SVG)}`;

const ui = {};

let busy = false;
let currentLocale = detectLocale();
let messages = getMessages(currentLocale);
let recentDraws = [];
let activeQuoteIndex = null;

const CARD_DIMENSIONS = {
  default: { width: 280, height: 400 },
  balanced: { width: 300, height: 430 },
  spacious: { width: 320, height: 460 },
};

const BALANCED_CARD_LOCALES = new Set(['ja', 'ko']);
const SPACIOUS_CARD_LOCALES = new Set(['en', 'fr', 'de']);

const ALL_QUOTE_INDICES = Array.from({ length: getQuoteCount() }, (_, index) => index);

function t(key, params) {
  return translate(messages, key, params);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cacheUi() {
  ui.heroTitle = document.getElementById('heroTitle');
  ui.heroSubtitle = document.getElementById('heroSubtitle');
  ui.languageLabel = document.getElementById('languageLabel');
  ui.langSelect = document.getElementById('langSelect');
  ui.drawAgainBtn = document.getElementById('drawAgainBtn');
  ui.mainBtn = document.getElementById('mainBtn');
  ui.drawFiveBtn = document.getElementById('drawFiveBtn');
  ui.deck = document.getElementById('deck');
  ui.drawnCards = document.getElementById('drawnCards');
  ui.history = document.getElementById('history');
  ui.quoteCount = document.getElementById('quoteCount');
  ui.explainOverlay = document.getElementById('explainOverlay');
  ui.explainBox = document.getElementById('explainBox');
  ui.explainTitle = document.getElementById('explainTitle');
  ui.explainQuote = document.getElementById('explainQuote');
  ui.explainText = document.getElementById('explainText');
  ui.closeBtn = document.getElementById('closeExplainBtn');
  ui.bgCanvas = document.getElementById('bgCanvas');
}

function buildSilhouetteImage() {
  const img = document.createElement('img');
  img.src = SILHOUETTE_SRC;
  img.alt = t('silhouetteAlt');
  img.draggable = false;
  img.dataset.fallback = 'true';
  return img;
}

function fillPortraitSlots(root = document) {
  root.querySelectorAll('.p').forEach((slot) => {
    const currentImage = slot.querySelector('img');
    if (currentImage) {
      currentImage.alt = currentImage.dataset.fallback === 'true' ? t('silhouetteAlt') : t('portraitAlt');
      return;
    }

    const img = document.createElement('img');
    img.src = PORTRAIT_SRC;
    img.alt = t('portraitAlt');
    img.draggable = false;
    img.addEventListener(
      'error',
      () => {
        slot.replaceChildren(buildSilhouetteImage());
      },
      { once: true }
    );
    slot.replaceChildren(img);
  });
}

function renderLanguageOptions() {
  const options = getSupportedLocales();
  ui.langSelect.innerHTML = options
    .map(({ code, nativeName }) => `<option value="${code}">${nativeName}</option>`)
    .join('');
}

function applyCardDimensions() {
  let dimensions = CARD_DIMENSIONS.default;

  if (SPACIOUS_CARD_LOCALES.has(currentLocale)) {
    dimensions = CARD_DIMENSIONS.spacious;
  } else if (BALANCED_CARD_LOCALES.has(currentLocale)) {
    dimensions = CARD_DIMENSIONS.balanced;
  }

  document.documentElement.style.setProperty('--card-w', `${dimensions.width}px`);
  document.documentElement.style.setProperty('--card-h', `${dimensions.height}px`);
}

function updateStaticDeckText(root = document) {
  root.querySelectorAll('[data-role="deck-name"]').forEach((element) => {
    element.textContent = t('deckName');
  });
  root.querySelectorAll('[data-role="deck-series"]').forEach((element) => {
    element.textContent = `— ${t('deckSeries')} —`;
  });
}

function updateDrawnCardsText() {
  ui.drawnCards.querySelectorAll('.dc').forEach((card) => {
    const index = Number(card.dataset.quoteIndex);
    const quoteData = getQuoteByIndex(currentLocale, index);
    const quoteText = card.querySelector('.qt');
    const source = card.querySelector('.qs');
    const tapHint = card.querySelector('.tap');

    card.lang = messages.htmlLang || currentLocale;
    card.setAttribute('aria-label', t('cardAriaLabel', { quote: quoteData?.q || '' }));
    if (quoteText && quoteData) {
      quoteText.textContent = quoteData.q;
    }
    if (source && quoteData) {
      source.textContent = `${t('sourceLabel')}: ${quoteData.s}`;
    }
    if (tapHint) {
      tapHint.textContent = t('tapHint');
    }
  });

  updateStaticDeckText(ui.drawnCards);
}

function updateQuoteCount() {
  ui.quoteCount.textContent = t('quoteCount', { count: getQuoteCount() });
}

function getExplanationText(quoteData) {
  return quoteData.e || t('defaultExplanation');
}

function applyLocale(nextLocale, { persist = false } = {}) {
  currentLocale = nextLocale;
  messages = getMessages(currentLocale);

  document.documentElement.lang = messages.htmlLang || currentLocale;
  applyCardDimensions();
  document.title = t('pageTitle');
  ui.heroTitle.textContent = t('heroTitle');
  ui.heroSubtitle.textContent = t('heroSubtitle');
  ui.languageLabel.textContent = t('languageLabel');
  if (ui.drawAgainBtn) {
    ui.drawAgainBtn.textContent = t('drawAgain');
  }
  ui.mainBtn.textContent = t('drawOne');
  if (ui.drawFiveBtn) {
    ui.drawFiveBtn.textContent = t('drawFive');
  }
  ui.explainTitle.textContent = t('explainTitle');
  ui.closeBtn.title = t('closeLabel');
  ui.closeBtn.setAttribute('aria-label', t('closeLabel'));
  ui.langSelect.value = messages.code;
  ui.langSelect.setAttribute('aria-label', t('languageLabel'));
  ui.history.setAttribute('aria-label', t('historyLabel'));

  updateStaticDeckText();
  updateDrawnCardsText();
  fillPortraitSlots();
  updateQuoteCount();
  updateHistory();

  if (activeQuoteIndex !== null) {
    const activeQuote = getQuoteByIndex(currentLocale, activeQuoteIndex);
    if (activeQuote) {
      ui.explainQuote.textContent = activeQuote.q;
      ui.explainText.textContent = getExplanationText(activeQuote);
    }
  }

  if (persist) {
    saveLocale(messages.code);
  }
}

function pickOne() {
  const recentSet = new Set(recentDraws.slice(-10));
  const candidates = ALL_QUOTE_INDICES.filter((index) => !recentSet.has(index));
  const pool = candidates.length ? candidates : ALL_QUOTE_INDICES;
  const pickedIndex = pool[Math.floor(Math.random() * pool.length)];
  recentDraws.push(pickedIndex);
  if (recentDraws.length > 50) {
    recentDraws.shift();
  }
  updateHistory();
  return pickedIndex;
}

function updateHistory() {
  const items = recentDraws.slice(-8);
  ui.history.innerHTML = items
    .map((index) => {
      const quoteData = getQuoteByIndex(currentLocale, index);
      const fullQuote = quoteData?.q || '';
      return `<span class="chip" title="${escapeHtml(fullQuote)}" aria-label="${escapeHtml(
        t('historyItemLabel', { quote: fullQuote })
      )}">${escapeHtml(getQuoteSummary(currentLocale, index))}</span>`;
    })
    .join('');
}

function buildCard(quoteData, index) {
  const el = document.createElement('div');
  el.className = 'dc';
  el.tabIndex = 0;
  el.lang = messages.htmlLang || currentLocale;
  el.dataset.quoteIndex = String(index);
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', t('cardAriaLabel', { quote: quoteData.q }));
  el.innerHTML = `
    <div class="ci">
      <div class="dc-face dc-back">
        <span class="s">★ ★ ★ ★ ★</span>
        <div class="p"><span class="pf">✦</span></div>
        <span class="n" data-role="deck-name"></span>
        <span class="t" data-role="deck-series"></span>
      </div>
      <div class="dc-face dc-front">
        <div class="ql">❝</div>
        <div class="qt">${escapeHtml(quoteData.q)}</div>
        <div class="qr">❞</div>
        <div class="qs">${escapeHtml(`${t('sourceLabel')}: ${quoteData.s}`)}</div>
        <div class="tap">${escapeHtml(t('tapHint'))}</div>
      </div>
    </div>`;
  updateStaticDeckText(el);
  fillPortraitSlots(el);
  el.addEventListener('click', () => showExplainByIndex(index));
  el.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      showExplainByIndex(index);
    }
  });
  return el;
}

function showExplainByIndex(index) {
  const quoteData = getQuoteByIndex(currentLocale, index);
  if (!quoteData) {
    return;
  }

  activeQuoteIndex = index;
  ui.explainQuote.textContent = quoteData.q;
  ui.explainText.textContent = getExplanationText(quoteData);
  ui.explainOverlay.classList.add('active');
  ui.explainOverlay.setAttribute('aria-hidden', 'false');
}

function closeExplain(event) {
  if (event && event.target !== event.currentTarget) {
    return;
  }
  ui.explainOverlay.classList.remove('active');
  ui.explainOverlay.setAttribute('aria-hidden', 'true');
  activeQuoteIndex = null;
}

function getViewportSize() {
  const viewport = window.visualViewport;
  const firstPositive = (...values) => values.find((value) => value > 0) || 0;
  const viewportWidth = firstPositive(
    window.innerWidth || 0,
    document.documentElement.clientWidth,
    document.body ? document.body.clientWidth : 0,
    viewport ? Math.round(viewport.width) : 0,
    document.body ? Math.round(document.body.getBoundingClientRect().width) : 0,
    Math.round(document.documentElement.getBoundingClientRect().width),
    screen.availWidth || 0,
    screen.width || 0
  );
  const viewportHeight = firstPositive(
    window.innerHeight || 0,
    document.documentElement.clientHeight,
    document.body ? document.body.clientHeight : 0,
    viewport ? Math.round(viewport.height) : 0,
    document.body ? Math.round(document.body.getBoundingClientRect().height) : 0,
    Math.round(document.documentElement.getBoundingClientRect().height),
    screen.availHeight || 0,
    screen.height || 0
  );

  return { viewportWidth, viewportHeight };
}

function singleDrawLayout(actionRect) {
  const cardHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-h')) || 400;
  const { viewportWidth, viewportHeight } = getViewportSize();
  const compact = viewportWidth < 700;
  const safeBottom = actionRect ? actionRect.top - (compact ? 30 : 38) : viewportHeight - 24;
  const minCenterY = cardHeight / 2 + (compact ? 26 : 34);
  const preferredCenterY = viewportHeight * (compact ? 0.43 : 0.45);
  const centerY = Math.max(minCenterY, Math.min(preferredCenterY, safeBottom - cardHeight / 2));

  return {
    x: viewportWidth / 2,
    y: centerY,
  };
}

function multiDrawLayout(count, deckRect, actionRect) {
  const { viewportWidth, viewportHeight } = getViewportSize();
  const baseWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-w')) || 280;
  const baseHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-h')) || 400;
  const ratio = baseWidth / baseHeight;
  const compact = viewportWidth < 700;
  const sidePadding = compact ? 16 : 28;
  const spreadFactor = compact ? 0.28 : 0.42;
  const maxWidth = viewportWidth - sidePadding * 2;
  const cardWidth = Math.min(baseWidth, maxWidth / (1 + spreadFactor * (count - 1)));
  const cardHeight = cardWidth / ratio;
  const step = cardWidth * spreadFactor;
  const centerX = viewportWidth / 2;
  const preferredCenterY = deckRect ? deckRect.top + deckRect.height * (compact ? 0.28 : 0.3) : viewportHeight * 0.32;
  const safeBottom = actionRect ? actionRect.top - 18 : viewportHeight - 24;
  const edgeDrop = Math.ceil(cardHeight * (compact ? 0.02 : 0.03));
  const centerY = Math.max(cardHeight / 2 + 22, Math.min(preferredCenterY, safeBottom - cardHeight / 2 - edgeDrop));
  const positions = [];
  const middle = (count - 1) / 2;

  for (let index = 0; index < count; index += 1) {
    const offset = index - middle;
    const depth = Math.abs(offset);
    positions.push({
      x: centerX + offset * step,
      y: centerY + depth * edgeDrop,
      rot: offset * (compact ? 3.5 : 4.5),
      w: cardWidth,
      h: cardHeight,
      z: 20 - depth * 2 + (offset === 0 ? 1 : 0),
      focusLift: compact ? 18 : 22,
    });
  }

  return positions;
}

function fanTransform(state, focused = false) {
  const lift = focused ? state.focusLift : 0;
  const rotation = focused ? state.rot * 0.3 : state.rot;
  return `translate(-50%, calc(-50% - ${lift}px)) rotate(${rotation}deg)`;
}

function attachFanCardInteraction(card, state) {
  const apply = (focused) => {
    card.style.zIndex = String(focused ? 60 : state.z);
    card.style.transform = fanTransform(state, focused);
  };

  card.addEventListener('mouseenter', () => apply(true));
  card.addEventListener('mouseleave', () => apply(false));
  card.addEventListener('focus', () => apply(true));
  card.addEventListener('blur', () => apply(false));
}

function commitAnimatedLayout(element, applyFinalState) {
  void element.offsetWidth;
  requestAnimationFrame(() => {
    requestAnimationFrame(applyFinalState);
  });
}

function drawOne() {
  if (busy) {
    return;
  }

  busy = true;
  ui.mainBtn.disabled = true;
  const deckRect = ui.deck.getBoundingClientRect();
  const actionRect = ui.mainBtn.getBoundingClientRect();
  const index = pickOne();
  const quote = getQuoteByIndex(currentLocale, index);
  const layout = singleDrawLayout(actionRect);

  ui.drawnCards.querySelectorAll('.dc').forEach((card) => {
    card.style.transition = 'all .4s ease-in';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    setTimeout(() => card.remove(), 400);
  });

  const card = buildCard(quote, index);
  card.style.transition = 'none';
  card.style.top = `${deckRect.top + deckRect.height / 2}px`;
  card.style.left = `${deckRect.left + deckRect.width / 2}px`;
  card.style.transform = 'translate(-50%,-50%) scale(0.5)';
  ui.drawnCards.appendChild(card);

  ui.deck.style.transition = 'opacity .4s';
  ui.deck.style.opacity = '0';
  spawnFromDeck(deckRect);

  commitAnimatedLayout(card, () => {
    card.classList.add('visible');
    card.style.transition = 'all .5s cubic-bezier(.25,.46,.45,.94)';
    card.style.top = `${layout.y}px`;
    card.style.left = `${layout.x}px`;
    card.style.transform = 'translate(-50%,-50%) scale(1)';
  });

  setTimeout(() => {
    card.classList.add('flipped');
    spawnConfetti(50);
  }, 650);

  setTimeout(() => {
    ui.deck.style.transition = 'opacity .6s .3s';
    ui.deck.style.opacity = '1';
    ui.mainBtn.disabled = false;
    busy = false;
  }, 1400);
}

function drawFive() {
  if (busy) {
    return;
  }

  busy = true;
  ui.mainBtn.disabled = true;
  const deckRect = ui.deck.getBoundingClientRect();
  const actionRect = ui.mainBtn.getBoundingClientRect();

  ui.drawnCards.querySelectorAll('.dc').forEach((card) => {
    card.style.transition = 'all .4s ease-in';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8)';
    setTimeout(() => card.remove(), 400);
  });

  const cards = [];
  for (let index = 0; index < 5; index += 1) {
    cards.push(pickOne());
  }

  const layout = multiDrawLayout(5, deckRect, actionRect);
  ui.deck.style.opacity = '0';
  spawnFromDeck(deckRect);
  spawnConfetti(100);

  cards.forEach((index, cardIndex) => {
    setTimeout(() => {
      const quote = getQuoteByIndex(currentLocale, index);
      const card = buildCard(quote, index);
      card.style.width = `${layout[cardIndex].w}px`;
      card.style.height = `${layout[cardIndex].h}px`;
      card.style.zIndex = String(layout[cardIndex].z);
      card.style.transition = 'none';
      card.style.top = `${deckRect.top + deckRect.height / 2}px`;
      card.style.left = `${deckRect.left + deckRect.width / 2}px`;
      card.style.transform = 'translate(-50%,-50%) scale(0.4)';
      ui.drawnCards.appendChild(card);
      attachFanCardInteraction(card, layout[cardIndex]);
      spawnFromDeck(deckRect);

      commitAnimatedLayout(card, () => {
        card.classList.add('visible');
        card.style.transition = 'all .6s cubic-bezier(.25,.46,.45,.94)';
        card.style.top = `${layout[cardIndex].y}px`;
        card.style.left = `${layout[cardIndex].x}px`;
        card.style.transform = fanTransform(layout[cardIndex]);
      });

      setTimeout(() => {
        card.classList.add('flipped');
        card.style.zIndex = String(layout[cardIndex].z);
        card.style.transform = fanTransform(layout[cardIndex]);
      }, 700 + cardIndex * 80);
    }, cardIndex * 250);
  });

  setTimeout(() => {
    ui.deck.style.transition = 'opacity .6s .3s';
    ui.deck.style.opacity = '1';
    ui.mainBtn.disabled = false;
    busy = false;
  }, 3200);
}

function spawnFromDeck(deckRect) {
  const centerX = deckRect.left + deckRect.width / 2;
  const centerY = deckRect.top + deckRect.height / 2;
  const colors = ['#d4a017', '#f0d060', '#c62828', '#e8dcc8'];

  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement('div');
    const size = 2 + Math.random() * 6;
    const angle = Math.random() * Math.PI * 2;
    const spread = 60 + Math.random() * 150;
    const dx = Math.cos(angle) * spread;
    const dy = Math.sin(angle) * spread - Math.random() * 80;
    particle.className = 'particle';
    particle.style.cssText = `left:${centerX}px;top:${centerY}px;width:${size}px;height:${size}px;background:${colors[Math.random() * colors.length | 0]};border-radius:50%;box-shadow:0 0 ${size * 2}px ${colors[Math.random() * colors.length | 0]};--dx:${dx}px;--dy:${dy}px;animation:burst .9s ease-out forwards`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

function spawnConfetti(count) {
  const colors = ['#d4a017', '#c62828', '#f0d060', '#e8dcc8', '#ff6f00', '#cc3333'];

  for (let index = 0; index < count; index += 1) {
    const confetti = document.createElement('div');
    const size = 5 + Math.random() * 8;
    const x = Math.random() * 100;
    const duration = 2 + Math.random() * 3;
    const delay = Math.random() * 0.8;
    confetti.className = 'confetti';
    confetti.style.cssText = `left:${x}%;top:-20px;width:${size}px;height:${size * 1.4}px;background:${colors[Math.random() * colors.length | 0]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'};animation:confettiFall ${duration}s ease-in forwards;animation-delay:${delay}s`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), (duration + delay) * 1000 + 200);
  }
}

function injectDynamicKeyframes() {
  const keyframeStyle = document.createElement('style');
  keyframeStyle.textContent = `
@keyframes burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1}100%{transform:translateY(100vh) rotate(720deg) scale(.3);opacity:0}}
`;
  document.head.appendChild(keyframeStyle);
}

function initBackgroundCanvas() {
  const ctx = ui.bgCanvas.getContext('2d');
  let width;
  let height;
  const points = [];

  function resize() {
    width = ui.bgCanvas.width = window.innerWidth;
    height = ui.bgCanvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  for (let index = 0; index < 60; index += 1) {
    points.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    points.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0) point.x = width;
      if (point.x > width) point.x = 0;
      if (point.y < 0) point.y = height;
      if (point.y > height) point.y = 0;

      const alpha = 0.3 + 0.1 * Math.sin(Date.now() * 0.001 + point.x * 0.01);
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,160,23,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  draw();
}

function wireUi() {
  if (ui.drawAgainBtn) {
    ui.drawAgainBtn.addEventListener('click', drawOne);
  }
  ui.mainBtn.addEventListener('click', drawOne);
  if (ui.drawFiveBtn) {
    ui.drawFiveBtn.addEventListener('click', drawFive);
  }
  ui.explainOverlay.addEventListener('click', closeExplain);
  ui.explainBox.addEventListener('click', (event) => event.stopPropagation());
  ui.closeBtn.addEventListener('click', closeExplain);
  ui.langSelect.addEventListener('change', (event) => {
    applyLocale(event.target.value, { persist: true });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeExplain(event);
    }
  });
}

function init() {
  cacheUi();
  injectDynamicKeyframes();
  renderLanguageOptions();
  wireUi();
  ui.explainOverlay.setAttribute('aria-hidden', 'true');
  applyLocale(currentLocale);
  initBackgroundCanvas();
}

document.addEventListener('DOMContentLoaded', init);