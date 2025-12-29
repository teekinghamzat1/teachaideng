const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const prisma = require('../config/db');
const { JWT_SECRET } = require('../config/jwt');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token with explicit selection aka Layer 2 Identity Context
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionPlan: true,
          schoolId: true,
          isSchoolAdmin: true,
        }
      });

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Attach rich user object to request
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        schoolId: user.schoolId,
        isSchoolAdmin: user.isSchoolAdmin
      };
      // Remove password from user object manually if needed, but for req.user it's fine as long as we don't send it back.
      // Next is called at the end
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    console.warn(`[AUTH_BLOCKED] No token for ${req.originalUrl} from ${req.ip}`);
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req, res, next) => {
  if (req.user && (req.user.role.toLowerCase() === 'admin' || req.user.role.toLowerCase() === 'superadmin') && !req.user.isSchoolAdmin) {
    next();
  } else {
    console.warn(`[ADMIN_BLOCKED] User ${req.user?.email || 'Unknown'} (Role: ${req.user?.role}) blocked from ${req.originalUrl}`);
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };
