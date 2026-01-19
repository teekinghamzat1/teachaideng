const admin = (req, res, next) => {
    const userRole = (req.user?.role || '').toLowerCase();

    if (req.user && (userRole === 'admin' || userRole === 'superadmin')) {
        // SuperAdmins have access to everything, even if they're also school admins
        // Regular school admins (without superadmin role) should be restricted to schoolAdminRoutes
        if (req.user.isSchoolAdmin && userRole !== 'superadmin') {
            res.status(401);
            throw new Error('Not authorized as a global admin');
        }
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { admin };
