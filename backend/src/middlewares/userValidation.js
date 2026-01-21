const { z } = require('zod');
const validate = require('./validate');

const createUserSchema = z.object({
  body: z.strict(z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    schoolId: z.string().optional(),
    subscriptionPlan: z.string().optional(),
  })),
});

exports.validateCreateUser = validate(createUserSchema);
