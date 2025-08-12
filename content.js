(async () => {
  const url = location.href;
  let userId = null;

  const patterns = [
    /\/users\/(\d+)\/profile/,
    /\/user\/id=(\d+)/,
    /\/users\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      userId = match[1];
      break;
    }
  }
  if (!userId) return;

  const waitForElement = (selector, timeout = 7000) => new Promise((res, rej) => {
    const el = document.querySelector(selector);
    if (el) return res(el);
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        res(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      rej(null);
    }, timeout);
  });

  const containers = ['.profile-page__content', '#main-content', 'main', '.profile-container'];
  let profileMain = null;
  for (const sel of containers) {
    profileMain = await waitForElement(sel).catch(() => null);
    if (profileMain) break;
  }
  if (!profileMain) profileMain = document.body;

  if (getComputedStyle(profileMain).display !== 'flex') {
    profileMain.style.display = 'flex';
  }

  const container = document.createElement('div');
  container.style.cssText = `
    background: #1f1f1f;
    border-radius: 12px;
    padding: 20px;
    width: 240px;
    color: #eee;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    margin-left: 20px;
    flex-shrink: 0;
    user-select: none;
  `;
  container.textContent = 'Loading stats...';
  profileMain.appendChild(container);

  const makeStat = (id, label, value, url) => {
    const link = document.createElement('a');
    link.id = id;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = `
      display: block;
      color: #55aaff;
      text-decoration: none;
      margin-bottom: 16px;
      user-select: text;
    `;
    link.innerHTML = `
      <div style="font-size: 12px; color: #999; font-weight: 600;">${label}</div>
      <div style="font-size: 20px; font-weight: 700;">${value.toLocaleString()}</div>
    `;
    return link;
  };

  const makeTradeBtn = (userId) => {
    const btn = document.createElement('a');
    btn.href = `https://ecsr.io/trade/${userId}`;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.textContent = 'Trade';
    btn.style.cssText = `
      display: inline-block;
      background: #55aaff;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      text-align: center;
      user-select: none;
      transition: background-color 0.25s ease;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(85, 170, 255, 0.7);
      width: 100%;
    `;
    btn.addEventListener('mouseenter', () => btn.style.backgroundColor = '#3a88d7');
    btn.addEventListener('mouseleave', () => btn.style.backgroundColor = '#55aaff');
    return btn;
  };

  try {
    const [statusRes, ecomonsRes] = await Promise.all([
      fetch(`https://ecsr.io/apisite/users/v1/users/${userId}/status`, { credentials: 'include' }),
      fetch(`https://ecomons.vercel.app/api/users/${userId}`)
    ]);

    if (!statusRes.ok || !ecomonsRes.ok) throw new Error();

    const statusData = await statusRes.json();
    const ecomonsData = await ecomonsRes.json();

    const rapTotal = statusData.user.rap ?? 0;
    const valueTotal = ecomonsData.value ?? 0;

    container.textContent = '';
    container.appendChild(makeStat('rapStat', 'RAP', rapTotal, `https://ecsr.io/internal/collectibles?userId=${userId}`));
    container.appendChild(makeStat('valueStat', 'VALUE', valueTotal, `https://ecomons.vercel.app/user/${userId}`));
    container.appendChild(makeTradeBtn(userId));
  } catch {
    container.textContent = 'Failed to load stats';
  }
})();
