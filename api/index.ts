try {
  console.log("LAMBDA BOOT STARTING");
  const { app } = require("../backend/index");
  module.exports = app;
} catch (e: any) {
  console.error("FATAL LAMBDA BOOT CRASH:", e);
  const express = require("express");
  const fallback = express();
  fallback.all("*", (req: any, res: any) => {
    res.status(500).json({ error: e.toString(), stack: e.stack });
  });
  module.exports = fallback;
}
