const superAdmin = (req, res, next) => {
    if (req.user && req.user.role.toLowerCase() === 'superadmin') {
      next();
    } else {
      res.status(403);
      throw new Error('Forbidden: Not authorized as a superadmin');
    }
  };

  module.exports = { superAdmin };
