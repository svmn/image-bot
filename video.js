'use strict';

const search = require('youtube-search');
const Cursor = require('./cursor');
const cursor = new Cursor(10);

function searchVideo(query) {
  const opts = {
    key: process.env.API_KEY,
    type: 'video',
    safeSearch: 'none',
    maxResults: 10,
    relevanceLanguage: 'ru-RU'
  };

  return new Promise((resolve, reject) => {
    search(query, opts, (err, results) => {
      if (err) return reject(err);

      if (!cursor.has(query)) {
        cursor.set(query);
      } else {
        cursor.increment(query);
      }

      resolve(results[cursor.get(query)].link);
    });
  });
}

module.exports = searchVideo;
