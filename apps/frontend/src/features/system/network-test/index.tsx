import { NetworkErrorTest } from '@/components/network-error-test'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function NetworkTestPage() {
  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>网络错误处理测试</h1>
        </div>
        
        <div className='py-6'>
          <NetworkErrorTest />
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: '测试页面',
    href: '/network-test',
    isActive: true,
  },
]