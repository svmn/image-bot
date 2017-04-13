'use strict';

const _ = require('lodash');
const quiz = require('./quiz');

const ROUND_AMOUNT = 10;
const ROUND_DURATION = 20;

class Game {
  constructor(message, manager) {
    this.manager = manager;
    this.bot = manager.bot;
    this.questions = {};
    this.players = {
      [message.from.id]: message.from
    };
    this.started = false;
    this.chatId = message.chat.id;
    this.currentQuestion = null;

    this.bot.sendMessage(this.chatId, `Game created\nTo join type /register. When all are ready type /start`);
  }

  answer(callback) {
    const player = this.players[callback.from.id];
    const questionId = callback.message.message_id;

    if (!player) {
      return this.bot.answerCallbackQuery(callback.id, 'You are not in game');
    }

    if (questionId !== this.currentQuestion) {
      return this.bot.answerCallbackQuery(callback.id, 'Time is up');
    }

    if (!player.answers) {
      player.answers = {};
    }

    if (!_.isUndefined(player.answers[questionId])) {
      return this.bot.answerCallbackQuery(callback.id, 'You already answered');
    }

    const guess = callback.data === this.questions[questionId].answer;

    player.answers[questionId] = guess;

    this.bot.answerCallbackQuery(callback.id, guess ? 'Yes' : 'No');
  }

  join(message) {
    if (this.started) {
      return this.bot.sendMessage(this.chatId, 'Game already started', { reply_to_message_id: message.message_id });
    }

    const player = message.from;

    if (this.players[player.id]) {
      return this.bot.sendMessage(this.chatId, 'You are already in game', { reply_to_message_id: message.message_id });
    }

    this.players[player.id] = player;

    this.bot.sendMessage(this.chatId, `${player.first_name} joined`);
  }

  start(message) {
    if (this.started) {
      return this.bot.sendMessage(this.chatId, 'Game already started', { reply_to_message_id: message.message_id });
    }

    if (!this.players[message.from.id]) {
      return this.bot.sendMessage(this.chatId, 'Please join first', { reply_to_message_id: message.message_id });
    }

    this.started = true;

    this.bot.sendMessage(this.chatId, `Game is starting in 5 seconds. There will be ${ROUND_AMOUNT} rounds of ${ROUND_DURATION} seconds each. Good luck`);

    setTimeout(() => {
      for (let i = 0; i < ROUND_AMOUNT; i++) {
        setTimeout(() => this.sendQuestion(), i * ROUND_DURATION * 1000);
      }

      setTimeout(() => this.finish(), ROUND_AMOUNT * ROUND_DURATION * 1000);
    }, 5000);

  }

  sendQuestion() {
    quiz.get()
      .then(question => {
        return this.bot.sendPhoto(this.chatId, question.question, {
          reply_markup: {
            inline_keyboard: [question.options.map(option => ({ text: option, callback_data: option }))]
          }
        })
          .then(message => {
            this.questions[message.message_id] = {
              link: question.link,
              answer: question.answer
            };

            this.currentQuestion = message.message_id;
          });
      })
      .catch(console.error);
  }

  finish() {
     _.each(this.players, player => {
      player.score = _.reduce(player.answers, (score, guess, qId) => {
        return score + (guess ? 1 : 0);
      }, 0);
    });

    const scoreboard = _.sortBy(this.players, 'score').reverse();
    const winner = scoreboard[0].first_name;
    const scoreboardText = scoreboard.map((player, index) => `${index+1}. ${player.first_name} ${player.score}`);
    const info = _.values(this.questions).map((question, index) => `${index+1}. ${question.link}`);



    const text = `Game finished. The winner is ${winner}`
      + '\nScoreboard\n'
      + scoreboardText.join('\n')
      + '\nMatches:\n'
      + info.join('\n');

    this.bot.sendMessage(this.chatId, text);

    this.manager.remove(this.chatId);
  }
}

module.exports = Game;
