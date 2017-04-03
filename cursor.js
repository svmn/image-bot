'use strict';

module.exports = class Cursor {
  constructor(size) {
    this.index = [];
    this.size = size;
  }

  has(key) {
    return this.index.some(item => item.key === key);
  }

  get(key) {
    return this.index.find(item => item.key === key).value;
  }

  set(key) {
    this.index.unshift({ key, value: 0 });
    this.index = this.index.slice(0, this.size);
  }

  increment(key) {
    this.index.find(item => item.key === key).value += 1;
  }
}
