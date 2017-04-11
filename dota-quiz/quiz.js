'use strict';

const fetch = require('node-fetch');
const random = require('lodash/random');
const doUntil = require('async/doUntil');
const bluebird = require('bluebird');
const Jimp = require('jimp');

const ICON_HEIGHT = 33;
const ICON_WIDTH = 59;

const STEAM_API_KEY = process.env.STEAM_API_KEY; 

class DotaQuiz {
  constructor() {
    this.heroIcons = {};
  }

  _findMatch([from, to], cb) {
    const matchId = random(from ,to);
    return fetch(`https://api.steampowered.com/IDOTA2Match_570/GetMatchDetails/V001/?match_id=${matchId}&key=${STEAM_API_KEY}`)
      .then(response => response.json())
      .then(response => cb(null, response.result))
      .catch(err => cb(err));
  }

  findMatch([from, to]) {
    return new Promise((resolve, reject) => {
      const iteratee = callback => this._findMatch([from, to], callback);
      const test = match => match.lobby_type === 0 && match.duration > 600;
      const callback = (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }

      doUntil(iteratee, test, callback);
    });
  }

  getRange() {
    return fetch(`https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/V001/?key=${STEAM_API_KEY}`)
      .then(response => response.json())
      .then(response => response.result.matches[0].match_id)
      .then(max => [1, max]);
  }

  loadHeroIcons() {
    return fetch(`https://api.steampowered.com/IEconDOTA2_570/GetHeroes/v1?key=${STEAM_API_KEY}`)
      .then(response => response.json())
      .then(response => {
        response.result.heroes.forEach(item => {
          const name = item.name.replace('npc_dota_hero_', '');
          item.icon = `http://cdn.dota2.com/apps/dota2/images/heroes/${name}_sb.png`;
        });

        this.heroIcons = response.result.heroes.reduce((acc, item) => {
          acc[item.id] = item.icon;
          return acc;
        }, {});

        return response.result.heroes.length;
      })
      .then(count => console.log(`Loaded ${count} dota hero icons.`))
      .catch(console.error);
  }

  buildImage(match) {
      const radiantIcons = match.players.slice(0, 5).map(item => this.heroIcons[item.hero_id]);
      const direIcons = match.players.slice(5, 10).map(item => this.heroIcons[item.hero_id]);

      return bluebird.all([
        this.createIconSet(radiantIcons),
        this.createIconSet(direIcons)
      ])
        .spread((radiantIconSet, direIconSet) => {
          const width = ICON_WIDTH * 5;
          const lineHeight = 24;
          const padding = 10;
          const line = [
            padding,
            padding + lineHeight,
            padding + 2 * lineHeight,
            padding + 2 * lineHeight + ICON_HEIGHT + 4,
            padding + 3 * lineHeight + ICON_HEIGHT
          ];
          const height = 2 * padding + 3 * lineHeight + 2 * ICON_HEIGHT;

          const image = new Jimp(width, height, 0xFFFFFFFF);

          return Jimp.loadFont(Jimp.FONT_SANS_16_BLACK)
            .then(font => {
              image.print(font, 110, line[0], 'Who won?');
              image.print(font, 120, line[1], 'Radiant');
              image.composite(radiantIconSet, 0, line[2]);
              image.print(font, 130, line[3], 'Dire');
              image.composite(direIconSet, 0, line[4]);

              return new Promise((resolve, reject) => {
                image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                  if (err) return reject(err);
                  resolve({ match, image: buffer });
                });
              });
            });
        });
  }

  createIconSet(set) {
    const image = new Jimp(ICON_WIDTH * 5, ICON_HEIGHT);

    return bluebird.each(set, (url, index) => {
      return Jimp.read(url)
        .then(icon => {
          image.composite(icon, ICON_WIDTH * index, 0);
        });
    })
      .then(() => image);
  }

  get() {
    return this.getRange()
      .then(range => this.findMatch(range))
      .then(match => this.buildImage(match));
  }
}

module.exports = new DotaQuiz();
