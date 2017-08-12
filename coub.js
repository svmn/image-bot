'use strict';

const fetch = require('node-fetch');
const Cursor = require('./cursor');
const cursor  = new Cursor(10);

function search(query) {
  return fetch('https://coub.com/api/v2/search/coubs?q=' + encodeURIComponent(query))
    .then(response => response.json())
    .then(results => {
      if (!cursor.has(query)) {
        cursor.set(query);
      } else {
        cursor.increment(query);
      }

      const item = results.coubs[cursor.get(query)];
      return item ? `https://coub.com/view/${item.permalink}` : null;
    })
}

module.exports = search;
