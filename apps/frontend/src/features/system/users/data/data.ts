import { Shield, UserCog, Users, Wrench } from 'lucide-react'

export const systemRoles = [
  {
    value: 'superadmin',
    label: '超级管理员',
    icon: Shield,
  },
  {
    value: 'admin',
    label: '管理员',
    icon: UserCog,
  },
  {
    value: 'manager',
    label: '经理',
    icon: Users,
  },
  {
    value: 'operator',
    label: '操作员',
    icon: Wrench,
  },
]

export const systemCallTypes = new Map([
  ['active', 'text-green-600 bg-green-50 border-green-200'],
  ['disabled', 'text-gray-600 bg-gray-50 border-gray-200'],
])

export const departments = [
  { value: '技术部', label: '技术部' },
  { value: '运营部', label: '运营部' },
  { value: '产品部', label: '产品部' },
  { value: '市场部', label: '市场部' },
  { value: '人事部', label: '人事部' },
]
