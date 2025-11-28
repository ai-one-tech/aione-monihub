import { z } from 'zod'

const systemUserStatusSchema = z.union([
  z.literal('active'),
  z.literal('disabled'),
])
export type SystemUserStatus = z.infer<typeof systemUserStatusSchema>

const systemUserRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('manager'),
  z.literal('operator'),
])

const systemUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: systemUserStatusSchema,
  role: systemUserRoleSchema,
  department: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lastLoginAt: z.coerce.date().optional(),
})
export type SystemUser = z.infer<typeof systemUserSchema>

export const systemUserListSchema = z.array(systemUserSchema)
