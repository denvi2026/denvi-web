import type { SelectedRegion } from '@/features/dental-analysis/model/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRestorationImage, getRestorationStatus, RestorationApiError, type RestorationResponse, submitRestoration } from '../api/restorationApi'
import { createRestorationMask, dataUrlToImageFile } from '../utils/mask'

export type RestorationPhase = 'idle' | 'submitting' | 'queued' | 'processing' | 'succeeded' | 'failed'
const POLL_INTERVAL_MS = 1500
const MAX_WAIT_MS = 90_000

const waitForPoll = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = window.setTimeout(resolve, POLL_INTERVAL_MS)
  signal.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('aborted', 'AbortError')) }, { once: true })
})

export function useRestoration() {
  const controllerRef = useRef<AbortController | null>(null)
  const resultUrlsRef = useRef<string[]>([])
  const [phase, setPhase] = useState<RestorationPhase>('idle')
  const [job, setJob] = useState<RestorationResponse | null>(null)
  const [resultUrls, setResultUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const revokeResults = useCallback(() => {
    resultUrlsRef.current.forEach(URL.revokeObjectURL)
    resultUrlsRef.current = []
    setResultUrls([])
  }, [])
  const cancel = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setJob(null)
    setError(null)
    setPhase('idle')
  }, [])
  const reset = useCallback(() => { cancel(); revokeResults(); setJob(null); setError(null); setPhase('idle') }, [cancel, revokeResults])

  const start = useCallback(async (imageDataUrl: string, region: SelectedRegion) => {
    if (controllerRef.current) return
    reset()
    const controller = new AbortController()
    controllerRef.current = controller
    setPhase('submitting')
    try {
      const { file, image } = await dataUrlToImageFile(imageDataUrl)
      const maskBlob = await createRestorationMask(image.naturalWidth, image.naturalHeight, region)
      const accepted = await submitRestoration({ image: file, mask: new File([maskBlob], 'restoration-mask.png', { type: 'image/png' }), signal: controller.signal })
      setJob(accepted)
      setPhase(accepted.status === 'PROCESSING' ? 'processing' : 'queued')
      const deadline = Date.now() + MAX_WAIT_MS
      let current = accepted
      while (current.status !== 'SUCCEEDED') {
        if (current.status === 'FAILED') throw new Error(current.errorMessage || '복원 작업이 실패했습니다.')
        if (Date.now() >= deadline) throw new Error('복원 작업의 최대 대기 시간을 초과했습니다.')
        await waitForPoll(controller.signal)
        current = await getRestorationStatus(accepted.jobId, controller.signal)
        setJob(current)
        setPhase(current.status === 'PROCESSING' ? 'processing' : 'queued')
      }
      const blobs = await Promise.all(current.resultImages.map((_, index) => fetchRestorationImage(current.jobId, index, controller.signal)))
      const urls = blobs.map(blob => URL.createObjectURL(blob))
      resultUrlsRef.current = urls
      setResultUrls(urls)
      setJob(current)
      setPhase('succeeded')
    } catch (caught) {
      if ((caught as { name?: string }).name === 'AbortError') return
      const apiError = caught as RestorationApiError
      setError(apiError.status === 429 ? '작업 대기열이 가득 찼습니다. 잠시 후 다시 시도하세요.' : apiError.message || '복원 요청 중 네트워크 오류가 발생했습니다.')
      setPhase('failed')
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [reset])

  useEffect(() => () => { cancel(); resultUrlsRef.current.forEach(URL.revokeObjectURL) }, [cancel])
  return { phase, job, resultUrls, error, start, cancel, reset, isBusy: phase === 'submitting' || phase === 'queued' || phase === 'processing' }
}
