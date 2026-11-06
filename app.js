'use strict';

const app = document.getElementById('app');
const statusRegion = document.getElementById('status');
const brandName = 'Simply Embroidered';
const avatarUrl = './assets/simply-embroidered-avatar.png';
const storageKey = 'simply-embroidered-saved-v1';
const filters = [['all', 'All ideas'], ['beginners', 'For beginners'], ['flowers', 'Florals'], ['botanicals', 'Botanicals'], ['landscapes', 'Landscapes'], ['saved', 'Saved']];
let activeFilter = 'all';
let storageAvailable = true;
let savedPosts = new Set();
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(stored)) savedPosts = new Set(stored.filter(id => posts.some(post => post.id === id)));
} catch { storageAvailable = false; }

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const wordCount = html => html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
const readingTime = post => Math.ceil(wordCount(post.content) / 220);
const bookmarkIcon = '<svg aria-hidden="true" viewBox="0 0 18 22"><path d="M3 2h12v18l-6-4-6 4z"/></svg>';
const pages = {
  about: {
    title: 'A little thread. A little possibility.',
    label: 'Our story',
    content: `<p>Welcome to <strong>Simply Embroidered</strong>, a quiet corner for embroidery patterns, practical stitch guides, and ideas inspired by the natural world.</p><p>We love the small details: the curve of a stitched stem, the texture of a French knot, and the way a handful of colors can turn plain linen into something personal. This journal brings those details together in projects you can take at your own pace.</p><h2>Start where you are</h2><p>You do not need a large thread collection or a perfect first attempt. Begin with our six-stitch sampler, explore a botanical branch, or spend a longer session building a mountain landscape. Every guide includes materials, technique notes, and ways to adapt the idea.</p><p class="callout">Our project images are digitally created embroidery illustrations for inspiration. The written guides offer approaches to the designs rather than exact, tested kits or downloadable tracing patterns.</p><h2>Make it your own</h2><p>Change the palette, simplify a flower, or leave a little more linen showing. The best part of making things by hand is having room for your own decisions.</p><p><a class="text-link" href="#beginners">Find your first project <span aria-hidden="true">↗</span></a></p>`
  },
  privacy: {
    title: 'Privacy Policy', label: 'The small print',
    content: `<p><strong>Last updated: November 6, 2026</strong></p><p>This page describes the features included in this version of Simply Embroidered.</p><h2>Saved ideas on your device</h2><p>When you select a bookmark button, the site stores the relevant article identifiers in your browser's local storage. This allows your saved list to remain available on the same browser and device. The list is not sent to us by this application. You can remove individual bookmarks by selecting them again, or remove the full list through your browser's site-data controls.</p><p>If browser storage is unavailable, bookmarks work only for the current page session. Saved lists do not synchronize between devices.</p><h2>Cookies, advertising, and analytics</h2><p>This version does not include advertising scripts, analytics trackers, Pinterest tracking tags, third-party font requests, or an account system. It does not set application cookies. Local storage used for bookmarks is separate from cookies.</p><h2>Hosting information</h2><p>When the site is hosted online, the hosting provider may process ordinary request information such as IP addresses, requested pages, and access times under its own policies. This application does not provide us with a visitor analytics dashboard. The host's practices depend on the service used to publish it.</p><h2>Contact and external services</h2><p>Email links open your email application. If you send an email, the information you choose to include is handled by the email providers involved. External services apply their own privacy policies. Do not send confidential information through a general website inquiry.</p><h2>Changes to this site</h2><p>If advertising, analytics, forms, or other services are added, this notice should be updated to describe them. Any required consent features should be configured before those services run.</p><p>For privacy questions, visit our <a href="#contact">Contact page</a>.</p>`
  },
  terms: {
    title: 'Terms of Use', label: 'The small print',
    content: `<p><strong>Effective date: November 6, 2026</strong></p><h2>Using the journal</h2><p>Simply Embroidered shares embroidery ideas and educational material. Use the site respectfully and for lawful purposes. Do not attempt to disrupt the site or misrepresent its content as your own.</p><h2>Projects and illustrations</h2><p>The tutorials describe suggested techniques and materials. Project imagery is digitally created for inspiration. Finished results vary with materials, scale, and stitching choices. The articles do not include tested commercial kits or exact tracing templates.</p><h2>Creative use and republication</h2><p>You are welcome to use the ideas for your personal stitching practice and to link to the journal. Contact us before republishing complete articles, redistributing the site's image collection, or using the Simply Embroidered name or logo to imply an affiliation.</p><h2>Care with tools and materials</h2><p>Needles and scissors are sharp. Store them safely and supervise children using embroidery tools. Test marking tools, thread colorfastness, and cleaning methods on spare fabric before applying them to a finished piece.</p><h2>Availability and external services</h2><p>We aim to keep the journal useful, but content and availability may change. External websites and email services are managed by their respective operators. Check their terms before using them.</p><h2>Questions</h2><p>For questions about using this material, visit the <a href="#contact">Contact page</a>.</p>`
  },
  contact: {
    title: 'Let’s talk stitches.', label: 'Get in touch',
    content: `<p>Have a question about a technique, a suggestion for a future guide, or a note about the journal? We would love to hear it.</p><div class="contact-note"><p><strong>Email the editor</strong></p><p style="overflow-wrap:anywhere"><a href="mailto:contact@carolynadamsulo-creator.github.io">contact@carolynadamsulo-creator.github.io</a></p><p style="margin-bottom:0">For a project question, include the article title and the stitch you are working on so your message has useful context.</p></div><h2>A thoughtful note goes a long way</h2><p>Please keep messages respectful, avoid sending sensitive personal information, and use a clear subject line. For permission requests, describe which article or image you would like to use and where it would appear.</p><p>You can also browse the <a href="#beginners">beginner stitch guide</a> for help with thread tension, basic outlines, and French knots.</p>`
  }
};

function excerptMarkup(excerpt) {
  const lines = excerpt.split('\n').filter(Boolean);
  const tips = lines.filter(line => line.startsWith('• '));
  const prose = lines.filter(line => !line.startsWith('• '));
  return `<p class="card-description">${escapeHtml(prose[0] || '')}</p>${tips.length ? `<ul class="excerpt-tips">${tips.map(line => `<li>${escapeHtml(line.slice(2))}</li>`).join('')}</ul>` : ''}${prose.slice(1).map(line => `<p class="excerpt-end">${escapeHtml(line)}</p>`).join('')}`;
}

function cardMarkup(post) {
  const saved = savedPosts.has(post.id);
  return `<article class="post-card"><div class="card-media"><a href="#${post.id}" tabindex="-1" aria-hidden="true"><img src="${post.image}" alt="${escapeHtml(post.alt)}" width="1536" height="1024" loading="lazy" decoding="async"></a><button class="save-button" data-save="${post.id}" type="button" aria-pressed="${saved}" aria-label="${saved ? 'Unsave' : 'Save'} ${escapeHtml(post.title)}">${bookmarkIcon}</button></div><div class="card-meta"><span class="category">${escapeHtml(post.category)}</span><span aria-hidden="true">·</span><span>${readingTime(post)} min read</span></div><h3><a href="#${post.id}">${escapeHtml(post.title)}</a></h3>${excerptMarkup(post.excerpt)}<div class="card-footer"><time datetime="${post.isoDate}">${post.date}</time><a href="#${post.id}">Read the story <span aria-hidden="true">↗</span></a></div></article>`;
}

function renderGrid() {
  const grid = document.getElementById('post-grid');
  if (!grid) return;
  const visible = posts.filter(post => activeFilter === 'all' || (activeFilter === 'saved' ? savedPosts.has(post.id) : post.filter === activeFilter));
  grid.innerHTML = visible.length ? visible.map(cardMarkup).join('') : '<div class="empty-state"><h3>A little inspiration to keep.</h3><p>Tap the bookmark on an idea you love. Your saved stories will appear here on this browser.</p><button type="button" class="button" data-filter="all">Explore all ideas <span aria-hidden="true">↗</span></button></div>';
  document.querySelectorAll('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter)));
  document.getElementById('result-count').textContent = `${visible.length} ${visible.length === 1 ? 'story' : 'stories'} to explore`;
}

function renderHome() {
  app.innerHTML = `<section class="wrap hero" id="content"><div class="hero-copy"><div class="eyebrow">For the love of making</div><h1>Small stitches.<br><em>Lovely</em> possibilities.</h1><p>Find a little inspiration, learn a new stitch, and make something beautifully your own. A quiet corner for creative hands.</p><div class="hero-actions"><a class="button" href="#patterns">Explore the journal <span aria-hidden="true">↗</span></a><a class="text-link" href="#beginners">New to embroidery? <span aria-hidden="true">→</span></a></div><div class="hero-note"><span class="little-flower" aria-hidden="true">✳</span>Thoughtful projects. Gentle guidance. Your own pace.</div></div><div class="hero-visual"><img src="./assets/simply-embroidered-studio.png" alt="A wildflower embroidery hoop on cream linen with sage and terracotta thread, gold scissors, and soft window light" width="1536" height="1024" fetchpriority="high"><div class="hero-caption"><span aria-hidden="true">♡</span> A moment just for making.</div><span class="hero-number">THE SIMPLY EMBROIDERED JOURNAL</span></div></section><div class="ribbon"><div class="wrap"><span><b aria-hidden="true">✳</b> Nature-inspired ideas</span><span><b aria-hidden="true">⌁</b> Stitches worth learning</span><span><b aria-hidden="true">♡</b> Made at your own pace</span><span><b aria-hidden="true">↗</b> A little everyday creativity</span></div></div><section class="wrap journal" id="journal" aria-labelledby="journal-heading"><div class="section-heading"><div><div class="eyebrow">From the journal</div><h2 id="journal-heading">Your next little project.</h2></div><p>A few favorite ideas to inspire your next needle-and-thread moment.</p></div><div class="journal-toolbar"><div class="filters" role="group" aria-label="Filter embroidery stories">${filters.map(([id,label]) => `<button type="button" class="filter" data-filter="${id}" aria-pressed="${activeFilter === id}">${label}</button>`).join('')}</div><span id="result-count" class="result-count" aria-live="polite"></span></div><div id="post-grid" class="post-grid"></div></section><section class="wrap beginner-panel" aria-labelledby="beginner-heading"><div class="beginner-copy"><div class="eyebrow">One stitch is a beginning</div><h2 id="beginner-heading">You don’t have to be an expert to make something lovely.</h2><p>A hoop, a little linen, a few favorite colors. Start with six simple stitches and see where your hands take you.</p><a class="button" href="#${posts[1].id}">Try the beginner sampler <span aria-hidden="true">↗</span></a></div><ol class="beginner-steps"><li><span class="step-number" aria-hidden="true">01</span><div><strong>Gather a few simple things</strong><p>A hoop, fabric, embroidery floss, and a needle.</p></div></li><li><span class="step-number" aria-hidden="true">02</span><div><strong>Get to know your stitches</strong><p>Begin with a line. Then a leaf. Then a little flower.</p></div></li><li><span class="step-number" aria-hidden="true">03</span><div><strong>Make room for your own style</strong><p>Change a color, follow a curve, enjoy the process.</p></div></li></ol></section><section class="studio-note"><img src="${avatarUrl}" alt="Simply Embroidered floral hoop emblem" width="65" height="65" loading="lazy"><p>Some things are better made slowly.<br>A few small stitches are a lovely place to start.</p><a class="text-link" href="#about">A little about Simply Embroidered <span aria-hidden="true">↗</span></a></section>`;
  renderGrid();
}

function renderPage(page) {
  app.innerHTML = `<div class="wrap page-wrap" id="content"><a class="back-link" href="#home">← Back to the journal</a><div class="eyebrow">${page.label}</div><h1 class="page-title">${page.title}</h1><div class="page-copy">${page.content}</div></div>`;
}

function renderPost(post) {
  const saved = savedPosts.has(post.id);
  app.innerHTML = `<article class="wrap page-wrap" id="content"><a class="back-link" href="#patterns">← Back to the journal</a><header class="article-intro"><div class="eyebrow">${post.category}</div><h1>${escapeHtml(post.title)}</h1><div class="article-byline"><img src="${avatarUrl}" width="30" height="30" alt=""><span>${brandName}</span><span aria-hidden="true">·</span><time datetime="${post.isoDate}">${post.date}</time><span aria-hidden="true">·</span><span>${readingTime(post)} min read</span></div></header><img class="article-cover" src="${post.image}" alt="${escapeHtml(post.alt)}" width="1536" height="1024" fetchpriority="high"><div class="article-actions"><button type="button" data-save="${post.id}" aria-pressed="${saved}">${saved ? '✓ Story saved' : '♡ Save this story'}</button><button type="button" data-copy>Copy story link</button><button type="button" data-print>Print guide</button><a href="./articles/${post.articleFile}">Article HTML</a></div><div class="article-body">${post.content}<div class="article-ending"><a href="#patterns">← Explore more ideas</a><a href="#${posts[(posts.indexOf(post) + 1) % posts.length].id}">Next story →</a></div></div></article>`;
}

function closeMenu() {
  document.getElementById('main-nav').classList.remove('is-open');
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
}

function route(initial = false) {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = '__invalid'; }
  closeMenu();
  const post = posts.find(item => item.id === id);
  if (post) renderPost(post);
  else if (pages[id]) renderPage(pages[id]);
  else if (['', 'home', 'patterns', 'beginners', 'saved'].includes(id)) {
    activeFilter = id === 'beginners' ? 'beginners' : id === 'saved' ? 'saved' : 'all';
    renderHome();
  } else {
    renderPage({ title: 'This thread leads somewhere else.', label: 'Page not found', content: '<p>We could not find that story. There are still plenty of lovely ideas in the journal.</p><a class="button" href="#home">Find some inspiration <span aria-hidden="true">↗</span></a>' });
  }
  const pageTitle = post ? post.title : pages[id]?.title;
  document.title = pageTitle ? `${pageTitle} | ${brandName}` : 'Simply Embroidered | Patterns & Ideas';
  document.querySelector('meta[name="description"]').content = post ? post.excerpt.split('\n')[0] : 'Nature-inspired embroidery ideas, beginner stitch guides, and thoughtful projects to make at your own pace.';
  document.querySelectorAll('.main-nav a').forEach(link => {
    const current = link.hash === `#${id || 'home'}`;
    if (current) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (!initial) app.focus({ preventScroll: true });
  if (['patterns','beginners','saved'].includes(id)) document.getElementById('journal').scrollIntoView({ behavior: 'instant' });
  else window.scrollTo({ top: 0, behavior: 'instant' });
}

function toggleSave(id) {
  const post = posts.find(item => item.id === id);
  if (!post) return;
  const added = !savedPosts.has(id);
  if (added) savedPosts.add(id); else savedPosts.delete(id);
  try { localStorage.setItem(storageKey, JSON.stringify([...savedPosts])); storageAvailable = true; } catch { storageAvailable = false; }
  document.querySelectorAll('[data-save]').forEach(button => {
    if (button.dataset.save !== id) return;
    button.setAttribute('aria-pressed', String(added));
    if (button.classList.contains('save-button')) button.setAttribute('aria-label', `${added ? 'Unsave' : 'Save'} ${post.title}`);
    else button.textContent = added ? '✓ Story saved' : '♡ Save this story';
  });
  statusRegion.textContent = `${post.title} ${added ? 'saved' : 'removed from saved stories'}.${storageAvailable ? '' : ' Browser storage is unavailable; this change lasts for this page session.'}`;
  if (activeFilter === 'saved' && document.getElementById('post-grid')) {
    renderGrid();
    document.querySelector('.filter[data-filter="saved"]').focus();
  }
}

document.querySelector('.menu-toggle').addEventListener('click', event => {
  const expanded = event.currentTarget.getAttribute('aria-expanded') === 'true';
  event.currentTarget.setAttribute('aria-expanded', String(!expanded));
  document.getElementById('main-nav').classList.toggle('is-open', !expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.getElementById('main-nav').classList.contains('is-open')) { closeMenu(); document.querySelector('.menu-toggle').focus(); }
});
document.addEventListener('click', async event => {
  const filter = event.target.closest('[data-filter]');
  if (filter) { activeFilter = filter.dataset.filter; renderGrid(); return; }
  const save = event.target.closest('[data-save]');
  if (save) { toggleSave(save.dataset.save); return; }
  const copy = event.target.closest('[data-copy]');
  if (copy) {
    try { await navigator.clipboard.writeText(location.href); copy.textContent = '✓ Link copied'; statusRegion.textContent = 'Story link copied to the clipboard.'; }
    catch { copy.textContent = 'Copy the address from your browser'; statusRegion.textContent = 'Clipboard is unavailable. Copy the story URL from your address bar.'; }
    return;
  }
  if (event.target.closest('[data-print]')) { window.print(); return; }
  const link = event.target.closest('a[href^="#"]');
  if (link && link.hash === '#content') { event.preventDefault(); const content = document.getElementById('content'); if (content) { content.tabIndex = -1; content.focus(); content.scrollIntoView(); } return; }
  if (link && link.hash === location.hash) { event.preventDefault(); route(); }
});
window.addEventListener('hashchange', () => route());
window.addEventListener('storage', event => {
  if (event.key !== storageKey && event.key !== null) return;
  try { const values = JSON.parse(event.newValue || '[]'); savedPosts = new Set(Array.isArray(values) ? values.filter(id => posts.some(post => post.id === id)) : []); } catch { savedPosts = new Set(); }
  document.querySelectorAll('[data-save]').forEach(button => {
    const post = posts.find(item => item.id === button.dataset.save);
    const saved = savedPosts.has(post.id);
    button.setAttribute('aria-pressed', String(saved));
    if (button.classList.contains('save-button')) button.setAttribute('aria-label', `${saved ? 'Unsave' : 'Save'} ${post.title}`);
    else button.textContent = saved ? '✓ Story saved' : '♡ Save this story';
  });
  if (activeFilter === 'saved') renderGrid();
});
route(true);
