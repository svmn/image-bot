'use strict';

const TelegramBot = require('node-telegram-bot-api');
const searchImage = require('./image');
const searchVideo = require('./video');
const searchCoub = require('./coub');

const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const options = {
  webHook: {
    // Port to which you should bind is assigned to $PORT variable
    // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
    port: process.env.PORT
    // you do NOT need to set up certificates since Heroku provides
    // the SSL certs already (https://<app-name>.herokuapp.com)
    // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
  }
};
// Heroku routes from port :443 to $PORT
// Add URL of your app to env variable or enable Dyno Metadata
// to get this automatically
// See: https://devcenter.heroku.com/articles/dyno-metadata
const url = process.env.APP_URL || 'https://<app-name>.herokuapp.com:443';
const bot = new TelegramBot(TOKEN, options);


// This informs the Telegram servers of the new webhook.
// Note: we do not need to pass in the cert, as it already provided
const webhookUrl = `${url}/bot${token}`;
bot.setWebHook(webhookUrl)
  .then(() => console.log('Image bot started on ' + webhookUrl));
bot.onText(/^(?:пикча|image) (.+)/i, (message, raw) => {
  const query = raw[1].trim();

  if (!query) return;

  searchImage(query)
    .then(imageUrl => {
      return imageUrl 
        ? bot.sendPhoto(message.chat.id, imageUrl, { reply_to_message_id: message.message_id })
        : notFound(message);
    })
    .catch(err => {
      console.error(err);

      bot.sendMessage(message.chat.id, err.message, { reply_to_message_id: message.message_id })
        .catch(console.error);
    });
});

bot.onText(/^(?:видео|video) (.+)/i, (message, raw) => {
  const query = raw[1].trim();

  if (!query) return;

  searchVideo(query)
    .then(videoUrl => {
      return videoUrl
        ? bot.sendMessage(message.chat.id, videoUrl, { reply_to_message_id: message.message_id })
        : notFound(message);
    })
    .catch(err => onError(err, message));    
});

bot.onText(/^(?:куб|coub) (.+)/i, (message, raw) => {
  const query = raw[1].trim();

  if (!query) return;

  searchCoub(query)
    .then(url => {
      return url
        ? bot.sendMessage(message.chat.id, url, { reply_to_message_id: message.message_id })
        : notFound(message);
    })
    .catch(err => onError(err, message));    
});

bot.onText(/^quiz$/i, message => {
  bot.sendChatAction(message.chat.id, 'typing');

  quiz.get()
    .then(({ match, image }) => {
      return bot.sendPhoto(message.chat.id, image, {
        reply_to_message_id: message.message_id,
        reply_markup: {
          inline_keyboard: [[
            { text: 'Radiant', callback_data: 'radiant' },
            { text: 'Dire', callback_data: 'dire' },
          ]]
        }
      })
        .then(message => quiz.save(message, match));
    })
    .catch(err => onError(err, message));
});

function onError(err, message) {
  console.error(err);

  bot.sendMessage(message.chat.id, err.message, { reply_to_message_id: message.message_id })
    .catch(console.error);
}

function notFound(message) {
  bot.sendMessage(message.chat.id, 'Не нашел \u{1F614}', { reply_to_message_id: message.message_id });
}

require('./dota-quiz')(bot);
