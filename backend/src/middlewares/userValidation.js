
const { z } = require('zod');
const validate = require('./validate');

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.undefined({ message: 'Role cannot be set during creation' }),
    isSchoolAdmin: z.undefined({ message: 'isSchoolAdmin cannot be set during creation' }),
  }),
});

const validateCreateUser = validate(createUserSchema);

module.exports = {
  validateCreateUser,
};
