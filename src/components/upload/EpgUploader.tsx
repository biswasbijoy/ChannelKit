import { useCallback, useRef, useState, type DragEvent } from 'react'
import { useEpgStore } from '../../features/epg/epgStore'
import { parseXmltv } from '../../features/epg/parseXmltv'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export function EpgUploader() {
  const setEpgData = useEpgStore((s) => s.setEpgData)
  const isLoading = useEpgStore((s) => s.isLoading)
  const error = useEpgStore((s) => s.error)
  const setLoading = useEpgStore((s) => s.setLoading)
  const setError = useEpgStore((s) => s.setError)
  const channels = useEpgStore((s) => s.channels)

  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setLocalError(null)
    setError(null)

    if (!file.name.endsWith('.xml') && !file.name.endsWith('.xmltv')) {
      setLocalError('Please select a valid .xml or .xmltv file')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 20MB`)
      return
    }

    setLoading(true)
    try {
      const text = await file.text()
      const result = parseXmltv(text)
      setEpgData(result)
      if (result.channels.length === 0) {
        setLocalError('No EPG data found in the file')
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }, [setEpgData, setError, setLoading])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const onClick = () => {
    inputRef.current?.click()
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const displayError = localError || error

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClick}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-green-400 bg-green-900/20'
            : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
        }`}
      >
        <p className="text-sm mb-1">
          {dragOver ? 'Drop EPG file here' : 'Drag & drop XMLTV EPG'}
        </p>
        <p className="text-xs text-gray-500">or click to browse</p>

        {channels.length > 0 && (
          <p className="text-xs text-green-400 mt-2">
            {channels.length} channels with EPG data loaded
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xml,.xmltv"
        onChange={onChange}
        className="hidden"
      />

      {isLoading && (
        <p className="mt-2 text-xs text-green-400 animate-pulse">
          Parsing EPG data...
        </p>
      )}

      {displayError && (
        <p className="mt-2 text-xs text-red-400">{displayError}</p>
      )}
    </div>
  )
}
