const jwt = require('jsonwebtoken');

function getBearerToken(req) {
  const authorization = req.headers.authorization;
  return authorization && authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
}

function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function authenticateMaybeShare(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    req.shareToken = token;
    return next();
  }
}

module.exports = { authenticate, authenticateMaybeShare, getBearerToken };
