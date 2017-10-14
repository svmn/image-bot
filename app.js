'use strict';

const TelegramBot = require('node-telegram-bot-api');
const searchImage = require('./image');
const searchGif = require('./gif');
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
const bot = new TelegramBot(TOKEN, options);


// This informs the Telegram servers of the new webhook.
// Note: we do not need to pass in the cert, as it already provided
const webhookUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com/bot${TOKEN}`;
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

bot.onText(/^(?:гифка|gif) (.+)/i, (message, raw) => {
  const query = raw[1].trim();

  if (!query) return;

  searchGif(query)
    .then(imageUrl => {
      return imageUrl 
        ? bot.sendDocument(message.chat.id, imageUrl, { reply_to_message_id: message.message_id })
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

function onError(err, message) {
  console.error(err);

  bot.sendMessage(message.chat.id, err.message, { reply_to_message_id: message.message_id })
    .catch(console.error);
}

function notFound(message) {
  bot.sendMessage(message.chat.id, 'Не нашел \u{1F614}', { reply_to_message_id: message.message_id });
}

require('./dota-quiz')(bot);
