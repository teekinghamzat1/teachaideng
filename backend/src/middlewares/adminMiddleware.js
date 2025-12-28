const admin = (req, res, next) => {
    if (req.user && (req.user.role.toLowerCase() === 'admin' || req.user.role.toLowerCase() === 'superadmin')) {
        // SchoolAdmins should NOT have access to global admin functions.
        // They are restricted to their own school via schoolAdminRoutes.
        if (req.user.isSchoolAdmin) {
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
