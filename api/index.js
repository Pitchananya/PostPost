import { app } from '../backend/app.js';

export default function handler(req, res) {
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};
