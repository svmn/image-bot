'use strict';

const GameManager = require('./gameManager');
const quiz = require('./quiz');

module.exports = function (bot) {
  quiz.loadHeroIcons();

  const manager = new GameManager(bot);

  bot.onText(/^\/register(@ohime_bot)?$/i, message => {
    manager.register(message);
  });

  bot.onText(/^\/start(@ohime_bot)?$/i, message => {
    manager.start(message);
  });

  bot.on('callback_query', callback => {
    manager.answer(callback);
  });
};