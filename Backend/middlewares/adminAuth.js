const { verifyAdminToken } = require('../controllers/AdminController');

/**
 * Middleware to require valid Admin Bearer token for protected administrative endpoints.
 */
const requireAdmin = (req, res, next) => {
  const headers = req.headers || {};
  const authHeader = headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : (req.query?.token || headers['x-admin-token']);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Admin authentication token is required.',
    });
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired admin token.',
    });
  }

  req.admin = payload;
  next();
};

module.exports = requireAdmin;

