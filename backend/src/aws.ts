
import express from 'express';
import cors from 'cors';
import {verify} from 'jsonwebtoken';
import type {TokenData} from './routes/lightfunnels'

const app = express();

app.use(cors());

import {lightfunnelsConnect, lightfunnelsCallback} from './routes/lightfunnels';
import {webhooks} from './routes/webhooks';
import {api} from './api';
const bodyParser = require('body-parser');

app.use(bodyParser.json({}))

// routes that are mocked and run on real live app
app.post('/webhooks', webhooks);
app.post('/lightfunnels/connect', lightfunnelsConnect);
app.post('/lightfunnels/callback', lightfunnelsCallback);
app.use('/api', authMiddleware, api);
app.get('/', (req, res) => res.end('done'));

function authMiddleware(req, res, next){
  // verify will throw error if it fails here
  let data: TokenData = verify((req.get('Authorization') ?? '').slice(7), process.env.AppSecret);
  req.accountID = data.acid;
  next();
}

export {
  app
};