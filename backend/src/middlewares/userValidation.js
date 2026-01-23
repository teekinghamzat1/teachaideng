const { z } = require('zod');

const createUserSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2),
    email: z.string({ required_error: 'Email is required' }).email(),
    password: z.string({ required_error: 'Password is required' }).min(6),
    // Forbid role, isSchoolAdmin, and schoolId from being passed in the request body
    // This is a security measure to prevent privilege escalation
    role: z.undefined({ message: 'Cannot set role during creation' }),
    isSchoolAdmin: z.undefined({ message: 'Cannot set school admin status during creation' }),
    schoolId: z.undefined({ message: 'Cannot set school ID during creation' }),
    subscriptionPlan: z.string().optional(),
  }).strict(), // Use strict to ensure no extra fields are passed
});

module.exports = {
  createUserSchema,
};
