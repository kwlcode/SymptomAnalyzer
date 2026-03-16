try {
  const { app } = require("../backend/index");
  module.exports = app;
} catch (e: any) {
  const express = require("express");
  const fallback = express();
  fallback.all("*", (req: any, res: any) => {
    res.status(500).json({ error: e.toString(), stack: e.stack });
  });
  module.exports = fallback;
}
