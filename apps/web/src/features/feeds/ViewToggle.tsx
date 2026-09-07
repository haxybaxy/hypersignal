import { LayoutGridIcon, Rows3Icon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isViewMode, type ViewMode } from '@/features/sources/viewMode'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <Tabs value={value} onValueChange={(next) => isViewMode(next) && onChange(next)}>
      <TabsList aria-label="Feed layout">
        <TabsTrigger value="combined">
          <Rows3Icon data-icon="inline-start" />
          Combined
        </TabsTrigger>
        <TabsTrigger value="split">
          <LayoutGridIcon data-icon="inline-start" />
          Split
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
