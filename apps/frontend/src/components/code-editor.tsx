import React from 'react'
import TextareaCodeEditor from '@uiw/react-textarea-code-editor'
import rehypePrism from 'rehype-prism-plus'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { FormatButton } from '@/components/format-button'

interface CodeEditorProps {
  language: string
  value: string
  onChange: (value: string) => void
  minHeight?: number
  className?: string
  autoResize?: boolean
}

export function CodeEditor({
  language,
  value,
  onChange,
  minHeight = 400,
  className,
  autoResize = true,
}: CodeEditorProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [textareaEl, setTextareaEl] =
    React.useState<HTMLTextAreaElement | null>(null)
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (!containerRef.current) return
    const ta = containerRef.current.querySelector(
      'textarea'
    ) as HTMLTextAreaElement | null
    setTextareaEl(ta)
  }, [containerRef.current])

  React.useEffect(() => {
    if (!autoResize || !textareaEl) return
    textareaEl.style.height = 'auto'
    textareaEl.style.height = `${textareaEl.scrollHeight}px`
  }, [textareaEl, value, autoResize])

  const handleFormat = React.useCallback(() => {
    if (language === 'json') {
      try {
        const formatted = JSON.stringify(JSON.parse(value || '{}'), null, 2)
        onChange(formatted)
      } catch {}
    }
  }, [language, value, onChange])

  return (
    <div
      ref={containerRef}
      className={cn(
        'border-input bg-background relative rounded-md border',
        className
      )}
    >
      {language === 'json' && (
        <div className='sticky top-0 z-10 h-0'>
          <div className='absolute top-2 right-2'>
            <FormatButton onClick={handleFormat} />
          </div>
        </div>
      )}
      <TextareaCodeEditor
        value={value}
        language={language}
        data-color-mode={resolvedTheme}
        padding={10}
        minHeight={minHeight}
        rehypePlugins={[rehypePrism]}
        style={{
          fontSize: 12,
          fontFamily:
            'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
        }}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
          onChange(e.target.value)
        }}
      />
    </div>
  )
}
