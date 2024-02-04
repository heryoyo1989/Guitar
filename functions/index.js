const functions = require('firebase-functions');
const express = require('express');
const app = express();

app.get('/singers', (req, res) => {
  res.send(`random number is ${Math.random()}`);
})

exports.app = functions.https.onRequest(app);
