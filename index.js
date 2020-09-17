const express = require('express');
const line = require('@line/bot-sdk');
const BitlyClient = require('bitly').BitlyClient
const dotenv = require('dotenv');

dotenv.config()

const PORT = process.env.PORT || 11999
const app = express();

// ## LINE BOT CONFIG ##
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};
const client = new line.Client(config);
const handleLineEvent = async (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  // const repMsg = event.message.text
  const repMsg = await replyBitly(event.message.text)
  // console.log(repMsg);
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: repMsg
  });
}

// ## BITLY CONFIG ##
const bitlyAccessToken = process.env.BITLY_ACCESS_TOKEN
const bitly = new BitlyClient(bitlyAccessToken)

// ## SERVICES ##
const linkRegex = new RegExp(/https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/)

const logUserID = (body = {}) => { console.log(`UID | ${body && body.destination ? body.destination : ""}`) }
const logUserMsg = (msg = "") => { console.log(`Message | ${msg}`) }
const logMiniLink = (bitlyObj = {}) => { console.log(`Result | From: ${bitlyObj.long_url} | To: ${bitlyObj.link}`) }

const errMsg = () => `Link ผิดหรือเปล่าจ๊ะ ( Working Template ประมาณนี้นะ: http(s)://www.google.com )`
const workMsg = (link = "") => `ผลลัพธ์จ้า: ${link}`

const replyBitly = async (msg = "") => {
  logUserMsg(msg)

  if (!linkRegex.test(msg)) return errMsg()

  const resFromBitly = await bitly.shorten(msg)
  logMiniLink(resFromBitly)

  return workMsg(resFromBitly.link)
}

// ## API ##
app.post('/webhook', line.middleware(config), (req, res) => {
  logUserID(req.body)
  Promise
    .all(req.body.events.map(handleLineEvent))
    .then((result) => res.json(result))
    .catch(reason => console.error(reason))
});

app.listen(PORT, () => {
  console.log("application is listening on:", PORT);
});