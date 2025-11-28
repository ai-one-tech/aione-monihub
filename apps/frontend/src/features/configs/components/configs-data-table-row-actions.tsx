import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ConfigResponse } from '../api/configs-api'
import { useDeleteConfig } from '../hooks/use-configs-query'
import { useConfigsProvider } from './configs-provider'

export function ConfigsDataTableRowActions({
  row,
}: {
  row: Row<ConfigResponse>
}) {
  const { setIsSheetOpen, setSheetMode, setSelectedConfigId } =
    useConfigsProvider()
  const deleteMutation = useDeleteConfig()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          <DotsHorizontalIcon className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => {
            setSheetMode('view')
            setSelectedConfigId(row.original.id)
            setIsSheetOpen(true)
          }}
        >
          查看
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSheetMode('edit')
            setSelectedConfigId(row.original.id)
            setIsSheetOpen(true)
          }}
        >
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await deleteMutation.mutateAsync(row.original.id)
            toast.success('删除成功')
          }}
        >
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
