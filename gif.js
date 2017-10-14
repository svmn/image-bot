'use strict';

const giphy = require('giphy-api')();
const Cursor = require('./cursor');

const cursor = new Cursor(20);

function search(query) {
    return giphy.search(query)
	  .then(results => {
		if (!cursor.has(query)) {
			cursor.set(query);
		} else {
		  cursor.increment(query);
		}

		const item = results.data[cursor.get(query)];

		return item ? item.images.original : null;
	  });
}

module.exports = search;
