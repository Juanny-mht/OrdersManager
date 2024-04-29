const { Router } = require("express");

const router = Router();

router.use("/order", require("./order"));

module.exports = router;