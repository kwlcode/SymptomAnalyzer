const express = require('express');
const app = express();
app.all('*', (req: any, res: any) => res.status(200).json({ status: "Minimal Vercel Test OK" }));
module.exports = app;
