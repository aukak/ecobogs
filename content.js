(async () => {
  if (!document.getElementById('fa-style')) {
    const faLink = document.createElement('link');
    faLink.id = 'fa-style';
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(faLink);
  }

  const waitFor = (selector, timeout = 7000) => new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(null);
    }, timeout);
  });

  async function fetchRapAndValue(userId) {
    try {
      const collectiblesRes = await fetch(`https://ecsr.io/apisite/inventory/v1/users/${userId}/assets/collectibles`, { credentials: 'include' });
      const collectiblesData = await collectiblesRes.json();
      const collectibles = Array.isArray(collectiblesData) ? collectiblesData : (collectiblesData.data || []);

      const itemsRes = await fetch('https://ecomons.vercel.app/api/items');
      const itemsData = await itemsRes.json();
      const itemsArr = Array.isArray(itemsData) ? itemsData : (itemsData.data || []);

      const valueMap = new Map();
      itemsArr.forEach(item => {
        if (item.name && typeof item.value === 'number') {
          valueMap.set(item.name.trim(), item.value);
        }
      });

      const rapTotal = collectibles.reduce((sum, c) => sum + (c.recentAveragePrice || 0), 0);
      const valueTotal = collectibles.reduce((sum, c) => sum + (valueMap.get(c.name.trim()) || 0), 0);

      return { rapTotal, valueTotal };
    } catch (e) {
      console.error('[ecosbog] fetchRapAndValue error', e);
      return null;
    }
  }

  function createStatElement(label, value, link) {
    const container = document.createElement('div');
    container.className = 'col-12 col-lg-2 text-center';
    container.style.cursor = 'pointer';

    const labelEl = document.createElement('p');
    labelEl.className = 'statHeader-0-2-59';
    labelEl.style.textTransform = 'none'; 
    labelEl.style.marginBottom = '6px';
    labelEl.style.fontWeight = 'normal';
    labelEl.style.color = '#c3c3c3';
    labelEl.style.fontSize = '16px';
    labelEl.style.fontFamily = '"Roboto", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    labelEl.textContent = label;

    const valueEl = document.createElement('a');
    valueEl.className = 'statValue-0-2-60';
    valueEl.href = link;
    valueEl.target = '_blank';
    valueEl.rel = 'noopener noreferrer';
    valueEl.style.color = '#c3c3c3';
    valueEl.style.fontWeight = '500';  
    valueEl.style.fontSize = '18px';
    valueEl.style.fontFamily = '"Roboto", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    valueEl.textContent = value;

    container.appendChild(labelEl);
    container.appendChild(valueEl);

    return container;
  }

  async function insertRapValue() {
    const pathParts = location.pathname.split('/');
    const userId = pathParts.length > 2 ? pathParts[2] : null;
    if (!userId) return;

    const statsContainer = await waitFor('.col-12.col-lg-10.ps-0');
    if (!statsContainer) return;

    const row = statsContainer.querySelector('.row');
    if (!row) return;

    ['#ecosbog-rap', '#ecosbog-value', '#ecosbog-rank'].forEach(sel => {
      const existing = row.querySelector(sel);
      if (existing) existing.remove();
    });

    const data = await fetchRapAndValue(userId);
    if (!data) return;

    const rapEl = createStatElement('Rap', data.rapTotal.toLocaleString(), `https://ecsr.io/internal/collectibles?userId=${userId}`);
    rapEl.id = 'ecosbog-rap';

    const valueEl = createStatElement('Value', data.valueTotal.toLocaleString(), `https://ecomons.vercel.app/user/${userId}`);
    valueEl.id = 'ecosbog-value';

    const rankEl = createStatElement('Rank', 'Soon!', '#');
    rankEl.id = 'ecosbog-rank';
    rankEl.style.cursor = 'default';
    rankEl.querySelector('a').removeAttribute('href');
    rankEl.querySelector('a').style.color = '#c3c3c3';
    rankEl.querySelector('a').style.textDecoration = 'none';

    row.appendChild(rapEl);
    row.appendChild(valueEl);
    row.appendChild(rankEl);
  }

  let lastURL = location.href;
  setInterval(() => {
    if (location.href !== lastURL) {
      lastURL = location.href;
      if (/^\/users\/\d+\/profile/.test(location.pathname)) {
        setTimeout(insertRapValue, 300);
      }
    }
  }, 700);

  if (/^\/users\/\d+\/profile/.test(location.pathname)) {
    insertRapValue();
  }
})();
