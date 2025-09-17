'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { X } from 'lucide-react'
import { roles } from '../data/data'
import { type User } from '../data/schema'

const formSchema = z
  .object({
    firstName: z.string().min(1, '昵称是必填项'),
    lastName: z.string().min(1, '姓氏是必填项'),
    username: z.string().min(1, '用户名是必填项'),
    phoneNumber: z.string().optional(),
    email: z.string().optional().or(z.string().email('请输入有效的邮箱地址')),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, '角色是必填项'),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    {
      message: '密码是必填项',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 8
    },
    {
      message: '密码至少需要8个字符',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: '密码必须包含至少一个小写字母',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: '密码必须包含至少一个数字',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: '两次输入的密码不一致',
      path: ['confirmPassword'],
    }
  )
type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          role: '',
          phoneNumber: '',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  })

  const onSubmit = (values: UserForm) => {
    form.reset()
    showSubmittedData(values)
    onOpenChange(false)
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

  // 字符计数函数
  const getCharCount = (value: string, maxLength: number) => {
    return `${value?.length || 0}/${maxLength}`
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <div>
            <DialogTitle className='text-lg font-medium'>
              {isEdit ? '修改用户' : '添加用户'}
            </DialogTitle>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={() => onOpenChange(false)}
          >
            <X className='h-4 w-4' />
          </Button>
        </DialogHeader>
        <div className='max-h-[32rem] overflow-y-auto'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6 px-1'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='text-sm font-medium text-gray-700'>
                        <span className='text-red-500'>*</span> 昵称
                      </FormLabel>
                      <span className='text-xs text-gray-400'>
                        {getCharCount(field.value, 30)}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder='颜如玉'
                        className='w-full'
                        autoComplete='off'
                        maxLength={30}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='text-sm font-medium text-gray-700'>
                        <span className='text-red-500'>*</span> 用户名
                      </FormLabel>
                      <span className='text-xs text-gray-400'>
                        {getCharCount(field.value, 64)}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder='lishuyanla'
                        className='w-full'
                        maxLength={64}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='text-sm font-medium text-gray-700'>
                        手机号码
                      </FormLabel>
                      <span className='text-xs text-gray-400'>
                        {getCharCount(field.value || '', 11)}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder='请输入手机号码'
                        className='w-full'
                        maxLength={11}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='text-sm font-medium text-gray-700'>
                        邮箱
                      </FormLabel>
                      <span className='text-xs text-gray-400'>
                        {getCharCount(field.value || '', 255)}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder='请输入邮箱'
                        className='w-full'
                        maxLength={255}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel className='text-sm font-medium text-gray-700'>
                      <span className='text-red-500'>*</span> 角色
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='选择角色'
                      className='w-full'
                      items={roles.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <>
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem className='space-y-2'>
                        <FormLabel className='text-sm font-medium text-gray-700'>
                          <span className='text-red-500'>*</span> 密码
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder='请输入密码'
                            className='w-full'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem className='space-y-2'>
                        <FormLabel className='text-sm font-medium text-gray-700'>
                          <span className='text-red-500'>*</span> 确认密码
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            disabled={!isPasswordTouched}
                            placeholder='请再次输入密码'
                            className='w-full'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter className='flex justify-end gap-3 pt-6'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type='submit' form='user-form' className='bg-blue-600 hover:bg-blue-700'>
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
