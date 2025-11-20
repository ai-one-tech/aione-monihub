import { Button } from '@/components/ui/button'
import { useConfigsProvider } from './configs-provider'

export function ConfigsPrimaryButtons() {
  const { setIsSheetOpen, setSheetMode, setSelectedConfigId } = useConfigsProvider()
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => {
          setSheetMode('create')
          setSelectedConfigId(undefined)
          setIsSheetOpen(true)
        }}
      >新增配置</Button>
    </div>
  )
}