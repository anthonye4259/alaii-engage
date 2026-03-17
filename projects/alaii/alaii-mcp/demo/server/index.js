const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Simple in-memory comment store for demo
let comments = [
  { id: 'c1', author: 'user1', text: 'Love this!', network: 'facebook' },
  { id: 'c2', author: 'user2', text: 'How do I book?', network: 'linkedin' }
];

app.get('/accounts', (req, res) => {
  res.json([{ id: 'demo-fb', network: 'facebook' }, { id: 'demo-li', network: 'linkedin' }]);
});

app.get('/accounts/:accountId/comments', (req, res) => {
  res.json(comments.filter(c => c.network.includes(req.params.accountId.includes('fb') ? 'facebook' : 'linkedin')));
});

app.post('/accounts/:accountId/comments', async (req, res) => {
  const { commentId, body, actionType } = req.body;
  // Demo: append reply to in-memory comments and return accepted
  comments.push({ id: 'r-' + Date.now(), author: 'alaii-bot', text: body, replyTo: commentId });
  // In production: call platform APIs using tokens in process.env
  res.status(202).json({ status: 'accepted', id: commentId });
});

app.post('/accounts/:accountId/actions/dm', (req, res) => {
  // Queue DM for human approval in demo
  res.status(202).json({ status: 'queued' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Demo server listening on', port));
