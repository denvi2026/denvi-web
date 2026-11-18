import type { SelectedRegion } from '@/features/dental-analysis/model/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRestorationImage, getRestorationStatus, RestorationApiError, type RestorationResponse, type RestorationStatus, submitRestoration } from '../api/restorationApi'
import { createRestorationMask, dataUrlToImageFile } from '../utils/mask'

/**
 * idle → submitting → queued/processing (server job state) → downloading (result images) → succeeded.
 * failed: the server reported the job FAILED, or the submission itself was rejected.
 * interrupted: the browser stopped waiting (local wait limit, status lookup or download error, or the user
 * stopped waiting). The server job is NOT failed or cancelled and can be checked again with `resume()`.
 */
export type RestorationPhase = 'idle' | 'submitting' | 'queued' | 'processing' | 'downloading' | 'succeeded' | 'failed' | 'interrupted'
export type InterruptionReason = 'timeout' | 'lookup' | 'download' | 'stopped'

const POLL_INTERVAL_MS = 1500
const DEFAULT_MAX_WAIT_MS = 10 * 60_000
const MAX_CONSECUTIVE_POLL_FAILURES = 5

const parseMaxWait = (raw: string | undefined) => {
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_WAIT_MS
}
/** Local browser wait budget per polling session (VITE_RESTORATION_MAX_WAIT_MS, default 10 minutes). */
export const RESTORATION_MAX_WAIT_MS = parseMaxWait(import.meta.env.VITE_RESTORATION_MAX_WAIT_MS)

const waitForPoll = (signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = window.setTimeout(resolve, POLL_INTERVAL_MS)
  signal.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('aborted', 'AbortError')) }, { once: true })
})

const isAbort = (caught: unknown) => (caught as { name?: string }).name === 'AbortError'
/** Network errors, 5xx and 429 may succeed on the next poll; other 4xx (e.g. unknown job) will not. */
const isTransient = (caught: unknown) => caught instanceof TypeError || (caught instanceof RestorationApiError && (caught.status === undefined || caught.status >= 500 || caught.status === 429))
const phaseForStatus = (status: RestorationStatus): RestorationPhase => (status === 'PROCESSING' ? 'processing' : status === 'QUEUED' ? 'queued' : status === 'SUCCEEDED' ? 'downloading' : 'failed')

class Interrupted extends Error {
  constructor(readonly reason: InterruptionReason, message: string) { super(message) }
}

export function useRestoration() {
  const controllerRef = useRef<AbortController | null>(null)
  const resultUrlsRef = useRef<string[]>([])
  const jobRef = useRef<RestorationResponse | null>(null)
  const [phase, setPhase] = useState<RestorationPhase>('idle')
  const [job, setJobState] = useState<RestorationResponse | null>(null)
  const [resultUrls, setResultUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [interruption, setInterruption] = useState<InterruptionReason | null>(null)

  const setJob = useCallback((next: RestorationResponse | null) => { jobRef.current = next; setJobState(next) }, [])
  const revokeResults = useCallback(() => {
    resultUrlsRef.current.forEach(URL.revokeObjectURL)
    resultUrlsRef.current = []
    setResultUrls([])
  }, [])
  const abortPolling = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])
  const reset = useCallback(() => { abortPolling(); revokeResults(); setJob(null); setError(null); setInterruption(null); setPhase('idle') }, [abortPolling, revokeResults, setJob])

  const interrupt = useCallback((reason: InterruptionReason, message: string) => {
    setInterruption(reason)
    setError(message)
    setPhase('interrupted')
  }, [])

  /** Stops waiting in this browser only. The server job keeps running; no cancel API exists. */
  const cancel = useCallback(() => {
    const hadJob = Boolean(jobRef.current)
    abortPolling()
    if (hadJob) interrupt('stopped', '이 화면에서 결과 확인을 중지했습니다. 서버 작업은 계속 진행될 수 있습니다.')
    else { setError(null); setInterruption(null); setPhase('idle') }
  }, [abortPolling, interrupt])

  /** Polls `initial.jobId` until a terminal state, then downloads the results. Throws Interrupted for local problems. */
  const track = useCallback(async (initial: RestorationResponse, controller: AbortController) => {
    const { signal } = controller
    const deadline = Date.now() + RESTORATION_MAX_WAIT_MS
    let current = initial
    let failures = 0
    while (current.status === 'QUEUED' || current.status === 'PROCESSING') {
      if (Date.now() >= deadline) {
        throw new Interrupted('timeout', `브라우저 대기 시간(${Math.round(RESTORATION_MAX_WAIT_MS / 60_000)}분)을 넘었습니다. 서버 작업은 계속 진행 중일 수 있습니다.`)
      }
      await waitForPoll(signal)
      try {
        current = await getRestorationStatus(initial.jobId, signal)
        failures = 0
      } catch (caught) {
        if (isAbort(caught)) throw caught
        failures += 1
        if (isTransient(caught) && failures < MAX_CONSECUTIVE_POLL_FAILURES) continue
        if (caught instanceof RestorationApiError && caught.status === 404) {
          throw new Interrupted('lookup', '서버에서 이 작업을 찾을 수 없습니다. 서버가 재시작되었을 수 있으니 복원을 다시 요청해 주세요.')
        }
        const detail = caught instanceof RestorationApiError ? ` (${caught.status ?? '응답 없음'})` : ''
        throw new Interrupted('lookup', `작업 상태를 조회하지 못했습니다${detail}. 서버 작업은 계속 진행 중일 수 있습니다.`)
      }
      setJob(current)
      setPhase(phaseForStatus(current.status))
    }
    if (current.status === 'FAILED') {
      setJob(current)
      setError(current.errorMessage || '복원 작업이 실패했습니다.')
      setPhase('failed')
      return
    }

    setJob(current)
    setPhase('downloading')
    let blobs: Blob[]
    try {
      blobs = await Promise.all(current.resultImages.map((_, index) => fetchRestorationImage(current.jobId, index, signal)))
    } catch (caught) {
      if (isAbort(caught)) throw caught
      throw new Interrupted('download', '복원은 완료됐지만 결과 이미지를 불러오지 못했습니다. 다시 확인해 주세요.')
    }
    if (signal.aborted) return
    const urls = blobs.map(blob => URL.createObjectURL(blob))
    resultUrlsRef.current.forEach(URL.revokeObjectURL)
    resultUrlsRef.current = urls
    setResultUrls(urls)
    setError(null)
    setInterruption(null)
    setPhase('succeeded')
  }, [setJob])

  const runTracking = useCallback(async (initial: RestorationResponse, controller: AbortController) => {
    try {
      await track(initial, controller)
    } catch (caught) {
      if (isAbort(caught)) return
      if (caught instanceof Interrupted) { interrupt(caught.reason, caught.message); return }
      interrupt('lookup', '작업 상태 확인 중 오류가 발생했습니다. 서버 작업은 계속 진행 중일 수 있습니다.')
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [interrupt, track])

  const start = useCallback(async (imageDataUrl: string, region: SelectedRegion) => {
    if (controllerRef.current) return
    reset()
    const controller = new AbortController()
    controllerRef.current = controller
    setPhase('submitting')
    let accepted: RestorationResponse
    try {
      const { file, image } = await dataUrlToImageFile(imageDataUrl)
      const maskBlob = await createRestorationMask(image.naturalWidth, image.naturalHeight, region)
      accepted = await submitRestoration({ image: file, mask: new File([maskBlob], 'restoration-mask.png', { type: 'image/png' }), signal: controller.signal })
    } catch (caught) {
      if (controllerRef.current === controller) controllerRef.current = null
      if (isAbort(caught)) return
      // fetch() rejects with a TypeError ("Failed to fetch") when the backend is unreachable or CORS fails.
      if (caught instanceof TypeError) { setError('복원 서버에 연결할 수 없습니다. 네트워크 또는 서버 상태를 확인하세요.'); setPhase('failed'); return }
      const apiError = caught as RestorationApiError
      setError(apiError.status === 429 ? '작업 대기열이 가득 찼습니다. 잠시 후 다시 시도하세요.' : apiError.message || '복원 요청 중 네트워크 오류가 발생했습니다.')
      setPhase('failed')
      return
    }
    setJob(accepted)
    setPhase(phaseForStatus(accepted.status))
    await runTracking(accepted, controller)
  }, [reset, runTracking, setJob])

  /** Resumes status polling for the same jobId after an interruption. */
  const resume = useCallback(async () => {
    const current = jobRef.current
    if (controllerRef.current || !current) return
    const controller = new AbortController()
    controllerRef.current = controller
    setError(null)
    setInterruption(null)
    setPhase(current.status === 'SUCCEEDED' ? 'downloading' : phaseForStatus(current.status))
    // Re-read the job first so a job that finished meanwhile goes straight to downloading.
    await runTracking({ ...current, status: current.status === 'SUCCEEDED' ? 'SUCCEEDED' : 'QUEUED' }, controller)
  }, [runTracking])

  useEffect(() => () => {
    controllerRef.current?.abort()
    controllerRef.current = null
    resultUrlsRef.current.forEach(URL.revokeObjectURL)
    resultUrlsRef.current = []
  }, [])

  return {
    phase,
    job,
    resultUrls,
    error,
    interruption,
    start,
    cancel,
    resume,
    reset,
    canResume: phase === 'interrupted' && Boolean(job),
    isBusy: phase === 'submitting' || phase === 'queued' || phase === 'processing' || phase === 'downloading',
  }
}
