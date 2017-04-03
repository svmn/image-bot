'use strict';

const GoogleImages  = require('google-images');
const Cursor = require('./cursor');

const { CSE_ID, API_KEY } = process.env;
const client = new GoogleImages(CSE_ID, API_KEY);
const cursor = new Cursor(10);

function search(query) {
return client.search(query, { safe: 'off' })
	.then(results => {
		if (!cursor.has(query)) {
			cursor.set(query);
		} else {
		  cursor.increment(query);
		}

		return results[cursor.get(query)] ? results[cursor.get(query)].url : null;
	});
}

module.exports = search;
