const { Router } = require("express");

const router = Router();

router.use("/orders", require("./order"));

module.exports = router;