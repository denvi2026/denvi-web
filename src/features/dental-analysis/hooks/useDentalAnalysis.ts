import { useEffect, useState } from 'react'
import { dentalAnalysisApi } from '../api/dentalAnalysisApi'

export function useDentalAnalysis() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let active = true
    dentalAnalysisApi.isAvailable()
      .then(ready => { if (active) setIsReady(ready) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return {
    isReady,
    analyzeDentalImage: dentalAnalysisApi.analyzeImage.bind(dentalAnalysisApi),
    segmentTeeth: dentalAnalysisApi.segmentTeeth.bind(dentalAnalysisApi),
  }
}
