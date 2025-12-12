/* scripts/header.js
   Lightweight header UI logic for Nivesh-Yatra demo.
   Safe: only uses DOMContentLoaded and non-destructive DOM updates.
*/

document.addEventListener('DOMContentLoaded', () => {
  // elements (IDs/classes used in your HTML)
  const eyeBtn = document.getElementById('nyEyeBtn');
  const bellBtn = document.getElementById('nyBellBtn');
  const authWrap = document.getElementById('nyAuthBtns');
  const profileWrap = document.getElementById('nyProfile');
  const guestBtn = document.getElementById('nyGuestBtn');
  const loginBtn = document.getElementById('nyLoginBtn');
  const signupBtn = document.getElementById('nySignupBtn');

  // safe check: exit early if no header on page
  if (!authWrap) return;

  // Toggle "assets visibility" behavior (dummy visual toggle)
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      // toggle a class on body so CSS can hide sensitive numbers if desired
      document.body.classList.toggle('ny-assets-hidden');
      eyeBtn.classList.toggle('active');
    });
  }

  // Notifications placeholder
  if (bellBtn) {
    bellBtn.addEventListener('click', () => {
      // small demo behaviour: flash and console msg
      bellBtn.classList.add('ny-bell-flash');
      setTimeout(() => bellBtn.classList.remove('ny-bell-flash'), 700);
      console.log('Notifications clicked (demo).');
    });
  }

  // Guest login: create a lightweight "session" (demo only, stored in sessionStorage)
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      const guestName = 'Guest' + Math.floor(Math.random() * 1000);
      sessionStorage.setItem('nyUser', JSON.stringify({ name: guestName, guest: true }));
      renderProfile();
    });
  }

  // Login/Signup (demo stubs)
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const demoName = prompt('Demo login - enter a name', 'User' + Math.floor(Math.random()*99));
      if (demoName) {
        sessionStorage.setItem('nyUser', JSON.stringify({ name: demoName, guest: false }));
        renderProfile();
      }
    });
  }
  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      const demoName = prompt('Demo signup - pick a name', 'NewUser' + Math.floor(Math.random()*99));
      if (demoName) {
        sessionStorage.setItem('nyUser', JSON.stringify({ name: demoName, guest: false }));
        renderProfile();
      }
    });
  }

  // Render profile area depending on session
  function renderProfile() {
    const raw = sessionStorage.getItem('nyUser');
    const authNode = document.getElementById('nyAuthBtns');
    const profileNode = document.getElementById('nyProfile');

    if (raw && profileNode) {
      const u = JSON.parse(raw);
      // hide auth buttons
      if (authNode) authNode.style.display = 'none';

      // fill profile node
      profileNode.classList.remove('hidden');
      profileNode.innerHTML = `
        <div class="ny-avatar">${(u.name[0]||'U').toUpperCase()}</div>
        <div class="ny-profile-name">${u.name}</div>
      `;
    } else {
      // no user: show auth buttons, hide profile
      if (authNode) authNode.style.display = '';
      if (profileNode) {
        profileNode.classList.add('hidden');
        profileNode.innerHTML = '';
      }
    }
  }

  // initial render
  renderProfile();
});
