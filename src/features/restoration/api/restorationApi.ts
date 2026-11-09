export type RestorationStatus = 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'
export type RestorationView = 'RIGHT' | 'FRONT' | 'LEFT' | 'UPPER' | 'LOWER'

export type RestorationResponse = {
  jobId: string
  status: RestorationStatus
  mock: boolean
  createdAt: string
  completedAt: string | null
  resultImages: string[]
  errorCode: string | null
  errorMessage: string | null
}

export type SubmitRestorationInput = {
  image: File
  mask: File
  view?: RestorationView
  candidates?: number
  steps?: number
  guidanceScale?: number
  seed?: number
  maxSide?: 512 | 768 | 1024
  cropContext?: number
  featherPixels?: number
  signal?: AbortSignal
}

export class RestorationApiError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string) {
    super(message)
    this.name = 'RestorationApiError'
  }
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:8080' : '')).replace(/\/+$/, '')

const endpoint = (path: string) => `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`

async function readError(response: Response): Promise<RestorationApiError> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object') {
      const error = body as { code?: unknown; message?: unknown }
      const message = typeof error.message === 'string' ? error.message : `복원 요청에 실패했습니다. (${response.status})`
      return new RestorationApiError(message, response.status, typeof error.code === 'string' ? error.code : undefined)
    }
  } catch {
    // Some proxies return an empty or non-JSON error body.
  }
  return new RestorationApiError(`복원 요청에 실패했습니다. (${response.status})`, response.status)
}

async function parseResponse(response: Response): Promise<RestorationResponse> {
  if (!response.ok) throw await readError(response)
  return response.json() as Promise<RestorationResponse>
}

export async function submitRestoration(input: SubmitRestorationInput): Promise<RestorationResponse> {
  const formData = new FormData()
  formData.append('image', input.image)
  formData.append('mask', input.mask)
  const parameters: Record<string, string | number | undefined> = {
    view: input.view,
    candidates: input.candidates,
    steps: input.steps,
    guidanceScale: input.guidanceScale,
    seed: input.seed,
    maxSide: input.maxSide,
    cropContext: input.cropContext,
    featherPixels: input.featherPixels,
  }
  Object.entries(parameters).forEach(([name, value]) => {
    if (value !== undefined) formData.append(name, String(value))
  })

  const response = await fetch(endpoint('/api/v1/restorations'), { method: 'POST', body: formData, signal: input.signal })
  if (response.status !== 202) throw await readError(response)
  return parseResponse(response)
}

export async function getRestorationStatus(jobId: string, signal?: AbortSignal): Promise<RestorationResponse> {
  return parseResponse(await fetch(endpoint(`/api/v1/restorations/${encodeURIComponent(jobId)}`), { signal }))
}

export async function fetchRestorationImage(jobId: string, index: number, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(endpoint(`/api/v1/restorations/${encodeURIComponent(jobId)}/images/${index}`), { signal })
  if (!response.ok) throw await readError(response)
  return response.blob()
}
