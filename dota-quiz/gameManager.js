'use strict';

const Game = require('./game');

class GameManager {
  constructor(bot) {
    this.bot = bot;
    this.games = new Map();
  }

  register(message) {
    const gameId = message.chat.id;
    let game = this.games.get(gameId);

    if (!game) {
      game = new Game(message, this);
      this.games.set(gameId, game);
    } else {
      game.join(message);
    }
  }

  start(message) {
    const gameId = message.chat.id;
    const game = this.games.get(gameId);

    if (!game) {
      return this.bot.sendMessage(gameId, 'No players in game');
    }

    game.start(message);
  }

  answer(callback) {
    const gameId = callback.message.chat.id;
    const game = this.games.get(gameId);

    if (!game) {
      return this.bot.answerCallbackQuery(callback.id, 'Game finished');
    }

    game.answer(callback);
  }

  remove(gameId) {
    this.games.delete(gameId);
  }
}

module.exports = GameManager;