// scripts/header.js
// Small header behaviour: show guest chip, hide the old auth buttons + duplicate header parts

document.addEventListener('DOMContentLoaded', function () {
  try {
    // hide legacy auth buttons (if present)
    const authBtns = document.getElementById('nyAuthBtns');
    if (authBtns) authBtns.style.display = 'none';

    // hide logged-in profile area (we're defaulting to guest)
    const profile = document.getElementById('nyProfile');
    if (profile) profile.classList.add('hidden');

    // show guest chip (if present)
    const guestChip = document.getElementById('nyGuestChip');
    if (guestChip) guestChip.style.display = 'inline-flex';

    // ensure the duplicate app header is hidden (defensive)
    const altHeader = document.querySelector('.app-header');
    if (altHeader) altHeader.classList.add('hidden');

    // small safety: if there is a stray text-only logo-badge element, hide it too
    const logoBadge = document.querySelector('.logo-badge');
    if (logoBadge) logoBadge.classList.add('hidden');

    // make header accessible: focusable guest chip
    if (guestChip) guestChip.setAttribute('tabindex', '0');

  } catch (err) {
    // do nothing — this file is non-blocking
    console.warn('header.js error', err);
  }
});
