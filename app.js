'use strict';

const TelegramBot = require('node-telegram-bot-api');
const searchImage = require('./image');
const searchVideo = require('./video');
const searchCoub = require('./coub');

const token = process.env.TELEGRAM_TOKEN;
// See https://developers.openshift.com/en/node-js-environment-variables.html
const options = {
  webHook: {
    port: process.env.OPENSHIFT_NODEJS_PORT || 3000,
    host: process.env.OPENSHIFT_NODEJS_IP || 'localhost',
    // you do NOT need to set up certificates since OpenShift provides
    // the SSL certs already (https://<app-name>.rhcloud.com)
  },
};
// OpenShift routes from port :443 to OPENSHIFT_NODEJS_PORT
const domain = process.env.OPENSHIFT_APP_DNS;
const url = `${domain}:443`;
const bot = new TelegramBot(token, options);


// This informs the Telegram servers of the new webhook.
// Note: we do not need to pass in the cert, as it already provided
const webhookUrl = `${url}/bot${token}`;
bot.setWebHook(webhookUrl)
  .then(() => console.log('Image bot started on ' + webhookUrl));

bot.onText(/^(?:пикча|image) (.+)/i, (message, raw) => {
  const query = raw[1].trim();

  if (!query) return;

  searchImage(query)
    .then(imageUrl => bot.sendPhoto(message.chat.id, imageUrl, { reply_to_message_id: message.message_id }))
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
    .then(videoUrl => bot.sendMessage(message.chat.id, videoUrl, { reply_to_message_id: message.message_id }))
    .catch(err => {
      console.error(err);

      bot.sendMessage(message.chat.id, err.message, { reply_to_message_id: message.message_id })
        .catch(console.error);
    });
});

bot.onText(/^(?:куб|coub) (.+)/i, (message, raw) => {
  const query = raw[1].trim();

  if (!query) return;

  searchCoub(query)
    .then(url => bot.sendMessage(message.chat.id, url, { reply_to_message_id: message.message_id }))
    .catch(err => {
      console.error(err);

      bot.sendMessage(message.chat.id, err.message, { reply_to_message_id: message.message_id })
        .catch(console.error);
    });
});
