import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  getCookie,
  setCookie,
  removeCookie,
  debugCookies,
  checkCookiePersistence,
} from '@/lib/cookies'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CookieDebug() {
  const [testName, setTestName] = useState('test_cookie')
  const [testValue, setTestValue] = useState('test_value')
  const { auth } = useAuthStore()

  const handleSetCookie = () => {
    setCookie(testName, testValue, 60 * 60) // 1小时
    console.log('设置测试cookie:', testName, testValue)
  }

  const handleGetCookie = () => {
    const value = getCookie(testName)
    console.log('获取测试cookie:', testName, '=', value)
    alert(`Cookie值: ${value || '未找到'}`)
  }

  const handleRemoveCookie = () => {
    removeCookie(testName)
    console.log('删除测试cookie:', testName)
  }

  const handleDebugCookies = () => {
    debugCookies()
  }

  const handleCheckPersistence = () => {
    checkCookiePersistence()
  }

  const handleTestAuth = () => {
    console.group('🔐 认证状态测试')
    console.log('当前认证状态:', auth.isAuthenticated)
    console.log('当前用户:', auth.user)
    console.log(
      '当前token:',
      auth.accessToken ? auth.accessToken.substring(0, 20) + '...' : '无'
    )

    // 检查认证相关的cookie
    const tokenCookie = getCookie('aione_auth_token')
    const userCookie = getCookie('aione_user_info')

    console.log('Token Cookie:', tokenCookie ? '✅ 存在' : '❌ 不存在')
    console.log('User Cookie:', userCookie ? '✅ 存在' : '❌ 不存在')

    if (tokenCookie) {
      console.log('Token Cookie值:', tokenCookie.substring(0, 50) + '...')
    }

    if (userCookie) {
      try {
        const userInfo = JSON.parse(userCookie)
        console.log('User Cookie解析:', userInfo)
      } catch (error) {
        console.error('User Cookie解析失败:', error)
      }
    }

    console.groupEnd()
  }

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle>Cookie 调试工具</CardTitle>
        <CardDescription>
          用于测试和调试cookie功能，帮助诊断登录状态丢失问题
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* 测试Cookie */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>测试Cookie操作</h3>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='cookie-name'>Cookie名称</Label>
              <Input
                id='cookie-name'
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder='输入cookie名称'
              />
            </div>
            <div>
              <Label htmlFor='cookie-value'>Cookie值</Label>
              <Input
                id='cookie-value'
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder='输入cookie值'
              />
            </div>
          </div>
          <div className='flex gap-2'>
            <Button onClick={handleSetCookie} variant='default'>
              设置Cookie
            </Button>
            <Button onClick={handleGetCookie} variant='outline'>
              获取Cookie
            </Button>
            <Button onClick={handleRemoveCookie} variant='destructive'>
              删除Cookie
            </Button>
          </div>
        </div>

        {/* 调试工具 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>调试工具</h3>
          <div className='flex gap-2'>
            <Button onClick={handleDebugCookies} variant='secondary'>
              显示所有Cookie
            </Button>
            <Button onClick={handleCheckPersistence} variant='secondary'>
              检查持久化状态
            </Button>
            <Button onClick={handleTestAuth} variant='secondary'>
              测试认证状态
            </Button>
          </div>
        </div>

        {/* 当前状态显示 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>当前状态</h3>
          <div className='bg-muted rounded-lg p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <strong>认证状态:</strong>{' '}
                {auth.isAuthenticated ? '✅ 已认证' : '❌ 未认证'}
              </div>
              <div>
                <strong>用户:</strong> {auth.user?.email || '无'}
              </div>
              <div>
                <strong>Token:</strong>{' '}
                {auth.accessToken ? '✅ 存在' : '❌ 不存在'}
              </div>
              <div>
                <strong>域名:</strong> {window.location.hostname}
              </div>
              <div>
                <strong>协议:</strong> {window.location.protocol}
              </div>
              <div>
                <strong>路径:</strong> {window.location.pathname}
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>使用说明</h3>
          <div className='text-muted-foreground space-y-1 text-sm'>
            <p>1. 登录后，点击"测试认证状态"查看cookie是否正确设置</p>
            <p>2. 刷新页面后，再次点击"测试认证状态"查看cookie是否持久化</p>
            <p>3. 如果cookie丢失，检查浏览器控制台的调试信息</p>
            <p>4. 可以使用"显示所有Cookie"查看当前域名下的所有cookie</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
