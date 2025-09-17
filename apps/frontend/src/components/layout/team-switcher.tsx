import * as React from 'react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const [activeTeam] = React.useState(teams[0])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='cursor-default'
        >
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <activeTeam.logo className='size-4' />
          </div>
          <div className='grid flex-1 text-start text-sm leading-tight'>
            <span className='truncate font-semibold'>
              {activeTeam.name}
            </span>
            <span className='truncate text-xs'>{activeTeam.plan}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
