(() => {
  'use strict';

  const url = new URL(window.location.href);
  if (!url.searchParams.has('v')) return;

  url.searchParams.delete('v');
  const query = url.searchParams.toString();
  const clean = `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
  window.history.replaceState(null, '', clean);
})();
