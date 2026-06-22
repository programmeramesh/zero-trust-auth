const jwt = require("jsonwebtoken");
const sessionService = require("../services/sessionService");

module.exports = async function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader)
    return res.status(401).json({ message: "No token, access denied" });

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const sessionValid = await sessionService.isSessionValid(verified.id, token);
    if (!sessionValid) {
      return res.status(401).json({ message: "Session invalid or expired" });
    }

    req.user = verified;
    req.token = token;
    await sessionService.updateSessionActivity(verified.id, token);
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

