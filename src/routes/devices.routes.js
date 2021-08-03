const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
  res.send("express server test pass");
});

module.exports = router;
