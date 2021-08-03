const express = require("express");
const router = express.Router();

router.post("/create", (req, res) => {
  res.send("express server test pass");
});

module.exports = router;
