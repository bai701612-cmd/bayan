import './style.css';

const state = { assets: [], activeSection: 'all', query: '' };
const sectionOrder = ['CV', 'افتار', 'باركود', 'بور بونت', 'خطة ترويجية', 'رابط الصفحة', 'صوت', 'صور', 'فكرة المشروع', 'فيديو'];
const kindLabels = { image: 'صورة', video: 'فيديو', audio: 'صوت', document: 'مستند', file: 'ملف' };
const iconLabels = { pdf: 'PDF', pptx: 'PPT', docx: 'DOC', mp3: '♪', mp4: '▶', jpg: 'IMG', jpeg: 'IMG', png: 'IMG', webp: 'IMG' };
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const safeUrl = (url) => encodeURI(url);
const shortName = (name) => name.replace(/\.[^/.]+$/, '');

async function loadAssets() {
  const response = await fetch('/assets/manifest.json');
  if (!response.ok) throw new Error('تعذر تحميل فهرس الحقيبة المهنية');
  state.assets = await response.json();
  $('#total-count').textContent = state.assets.length;
  renderFilters();
  renderGrid();
}

function renderFilters() {
  const container = $('#section-filters');
  const counts = Object.fromEntries(sectionOrder.map((section) => [section, state.assets.filter((asset) => asset.section === section).length]));
  const buttons = [{ id: 'all', label: 'كل الملفات', count: state.assets.length }, ...sectionOrder.map((section) => ({ id: section, label: section, count: counts[section] }))];
  container.innerHTML = buttons.map((button) => `
    <button class="filter-button ${state.activeSection === button.id ? 'is-active' : ''}" type="button" role="tab" aria-selected="${state.activeSection === button.id}" data-section="${button.id}">
      ${button.label} <span aria-hidden="true">${button.count}</span>
    </button>`).join('');
  $$('.filter-button', container).forEach((button) => button.addEventListener('click', () => {
    state.activeSection = button.dataset.section;
    renderFilters();
    renderGrid();
  }));
}

function filteredAssets() {
  const query = state.query.trim().toLocaleLowerCase('ar');
  return state.assets.filter((asset) => {
    const matchesSection = state.activeSection === 'all' || asset.section === state.activeSection;
    const matchesQuery = !query || `${asset.name} ${asset.section}`.toLocaleLowerCase('ar').includes(query);
    return matchesSection && matchesQuery;
  });
}

function cardBase(asset, inner, classes = '') {
  return `<article class="portfolio-card ${classes}" data-id="${encodeURIComponent(asset.id)}" aria-label="${asset.name}">${inner}</article>`;
}

function renderImage(asset) {
  const label = `${kindLabels[asset.kind]} · ${asset.section}`;
  return cardBase(asset, `<div class="media-preview"><img src="${safeUrl(asset.url)}" loading="lazy" alt="${asset.name}" /><div class="card-overlay"><div class="card-title"><strong title="${asset.name}">${shortName(asset.name)}</strong><span>${label}</span></div><button class="card-open" type="button" data-open="${encodeURIComponent(asset.id)}" aria-label="تكبير ${asset.name}">↗</button></div></div>`, 'image-card');
}

function renderVideo(asset) {
  return cardBase(asset, `<div class="media-preview video-card"><video controls preload="none" playsinline aria-label="تشغيل ${asset.name}" src="${safeUrl(asset.url)}"></video><div class="card-overlay"><div class="card-title"><strong title="${asset.name}">${shortName(asset.name)}</strong><span>فيديو · ${asset.section}</span></div><button class="card-open" type="button" data-open="${encodeURIComponent(asset.id)}" aria-label="فتح ${asset.name}">↗</button></div></div>`, 'video-card');
}

function renderAudio(asset) {
  return cardBase(asset, `<div class="audio-card"><div class="audio-orb" aria-hidden="true">♪</div><div><h3 title="${asset.name}">${shortName(asset.name)}</h3><p>صوت · ${asset.section} · ${formatSize(asset.size)}</p><audio controls preload="none" src="${safeUrl(asset.url)}" aria-label="تشغيل ${asset.name}"></audio></div></div>`, 'audio-card');
}

function renderDocument(asset) {
  const ext = asset.ext.toUpperCase();
  const openUrl = safeUrl(asset.url);
  return cardBase(asset, `<div class="file-card"><div><div class="file-icon" aria-hidden="true">${iconLabels[asset.ext] || ext}</div><h3 title="${asset.name}">${asset.name}</h3><p>${kindLabels[asset.kind]} · ${asset.section} · ${formatSize(asset.size)}</p></div><div class="file-actions"><a href="${openUrl}" target="_blank" rel="noreferrer">فتح الأصل ↗</a><a href="${openUrl}" download>تنزيل ↓</a></div></div>`, 'file-card');
}

function renderGrid() {
  const grid = $('#portfolio-grid');
  const assets = filteredAssets();
  $('#empty-state').hidden = assets.length > 0;
  grid.innerHTML = assets.map((asset) => {
    if (asset.kind === 'image') return renderImage(asset);
    if (asset.kind === 'video') return renderVideo(asset);
    if (asset.kind === 'audio') return renderAudio(asset);
    return renderDocument(asset);
  }).join('');
}

function openLightbox(asset) {
  const lightbox = $('#lightbox');
  const content = $('#lightbox-content');
  const title = $('#lightbox-title');
  const kind = $('#lightbox-kind');
  const openLink = $('#lightbox-open');
  const url = safeUrl(asset.url);
  title.textContent = asset.name;
  kind.textContent = `${kindLabels[asset.kind]} · ${asset.section} · ${formatSize(asset.size)}`;
  openLink.href = url;
  openLink.setAttribute('download', '');
  if (asset.kind === 'image') content.innerHTML = `<img src="${url}" alt="${asset.name}" />`;
  else if (asset.kind === 'video') content.innerHTML = `<video src="${url}" controls autoplay playsinline></video>`;
  else if (asset.kind === 'audio') content.innerHTML = `<audio src="${url}" controls autoplay></audio>`;
  else if (asset.ext === 'pdf') content.innerHTML = `<iframe title="${asset.name}" src="${url}" style="width:100%;height:62vh;border:0;border-radius:15px;background:#fff"></iframe>`;
  else content.innerHTML = `<div class="file-card" style="min-height:240px;align-items:center;text-align:center"><div class="file-icon">${iconLabels[asset.ext] || asset.ext.toUpperCase()}</div><h3>${asset.name}</h3><p>يمكن فتح الأصل أو تنزيله من الزر أدناه.</p></div>`;
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  $('.lightbox-close').focus();
}

let lastLightboxTrigger = null;

function closeLightbox() {
  const lightbox = $('#lightbox');
  if (lightbox.hidden) return;
  lightbox.hidden = true;
  $('#lightbox-content').innerHTML = '';
  document.body.style.overflow = '';
  if (lastLightboxTrigger && document.contains(lastLightboxTrigger)) lastLightboxTrigger.focus();
}

function setupPortfolioInteractions() {
  $('#portfolio-grid').addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open]');
    if (!trigger) return;
    const asset = state.assets.find((item) => encodeURIComponent(item.id) === trigger.dataset.open);
    if (asset) { lastLightboxTrigger = trigger; openLightbox(asset); }
  });
  $('#search-input').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderGrid();
  });
  $('#clear-search').addEventListener('click', () => {
    state.query = '';
    $('#search-input').value = '';
    renderGrid();
    $('#search-input').focus();
  });
  $$('[data-close-lightbox]').forEach((item) => item.addEventListener('click', closeLightbox));
  document.addEventListener('keydown', (event) => {
    if ($('#lightbox').hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key !== 'Tab') return;
    const focusable = $$('button:not([disabled]), a[href], input, audio[controls], video[controls], iframe', $('#lightbox'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

function revealSite() {
  const welcome = $('#welcome');
  const shell = $('#app-shell');
  welcome.classList.add('is-hidden');
  shell.setAttribute('aria-hidden', 'false');
  shell.classList.add('is-visible');
  try { sessionStorage.setItem('bayaan-welcome-seen', '1'); } catch (_) { /* private browsing */ }
}

function setupWelcome() {
  const welcome = $('#welcome');
  const enter = $('.enter-button');
  const skip = $('.skip-button');
  enter.addEventListener('click', revealSite);
  skip.addEventListener('click', revealSite);
  window.setTimeout(() => { if (!welcome.classList.contains('is-hidden')) enter.focus(); }, 80);
  let seen = false;
  try { seen = sessionStorage.getItem('bayaan-welcome-seen') === '1'; } catch (_) { /* private browsing */ }
  if (seen) window.setTimeout(revealSite, 50);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) welcome.classList.add('reduced-motion');
}

function setupCursor() {
  if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cursor = $('#cursor-glow');
  let last = 0;
  window.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.style.opacity = '1';
    const now = performance.now();
    if (now - last < 90) return;
    last = now;
    const star = document.createElement('span');
    star.className = 'cursor-star';
    star.textContent = Math.random() > .45 ? '✦' : '·';
    star.style.left = `${event.clientX + (Math.random() * 16 - 8)}px`;
    star.style.top = `${event.clientY + (Math.random() * 16 - 8)}px`;
    document.body.appendChild(star);
    window.setTimeout(() => star.remove(), 850);
  }, { passive: true });
  window.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
}

setupWelcome();
setupPortfolioInteractions();
setupCursor();
loadAssets().catch((error) => {
  console.error(error);
  $('#portfolio-grid').innerHTML = '<p class="empty-state">تعذر تحميل فهرس الحقيبة المهنية. أعد تحميل الصفحة للمحاولة مرة أخرى.</p>';
});
