export type GenerateTreatmentSimulationInput = {
  imageBase64: string
  imageMimeType?: string
  description?: string
  treatmentCategories?: string[]
  signal?: AbortSignal
}

export interface TreatmentSimulationApi {
  generateTreatmentSimulation(input: GenerateTreatmentSimulationInput): Promise<string>
}

const mockTreatmentSimulationApi: TreatmentSimulationApi = {
  async generateTreatmentSimulation(input) {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 700)
      input.signal?.addEventListener('abort', () => {
        window.clearTimeout(timer)
        reject(new DOMException('aborted', 'AbortError'))
      }, { once: true })
    })
    return input.imageBase64
  },
}

// Replace this adapter with an HTTP implementation when the GPU service is available.
export const treatmentSimulationApi: TreatmentSimulationApi = mockTreatmentSimulationApi
