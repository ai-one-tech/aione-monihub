import { useEffect } from 'react'
import { useNavigate, useRouter, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  const location = useLocation()

  // 自动纠正由于路由分组前缀导致的 404（例如 /_authenticated/...）
  useEffect(() => {
    const pathname = location.pathname || ''
    // 仅处理以 `/_authenticated/` 开头的路径
    if (pathname.startsWith('/_authenticated/')) {
      const normalizedPath = pathname.replace('/_authenticated', '') || '/'
      // 将查询参数转换为对象
      let searchObj: Record<string, string> | undefined
      try {
        const params = new URLSearchParams(location.search ?? '')
        searchObj = Object.fromEntries(params.entries())
      } catch {
        searchObj = undefined
      }
      // 重定向到去除分组前缀的真实路径
      navigate({ to: normalizedPath, search: searchObj as any, replace: true })
    }
  }, [location.pathname, location.search, navigate])
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
        <span className='font-medium'>Oops! Page Not Found!</span>
        <p className='text-muted-foreground text-center'>
          It seems like the page you're looking for <br />
          does not exist or might have been removed.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>Back to Home</Button>
        </div>
      </div>
    </div>
  )
}
