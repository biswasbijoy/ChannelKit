import { parseM3u } from './parseM3u'

interface WorkerMessage {
  type: 'parse'
  content: string
  fileName?: string
}

interface ProgressMessage {
  type: 'progress'
  linesProcessed: number
  totalLines: number
}

interface ResultMessage {
  type: 'result'
  payload: ReturnType<typeof parseM3u>
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.type === 'parse') {
    const { content, fileName } = e.data
    const lines = content.split(/\r?\n/)
    const totalLines = lines.length

    // Send progress periodically
    let lastProgress = 0
    const progressInterval = Math.max(1, Math.floor(totalLines / 10))

    const result = parseM3u(content, fileName)

    for (let i = 0; i < lines.length; i++) {
      if (i - lastProgress >= progressInterval) {
        lastProgress = i
        const progressMsg: ProgressMessage = {
          type: 'progress',
          linesProcessed: i,
          totalLines,
        }
        self.postMessage(progressMsg)
      }
    }

    const resultMsg: ResultMessage = {
      type: 'result',
      payload: result,
    }
    self.postMessage(resultMsg)
  }
}
