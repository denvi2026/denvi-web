export type PredictionPoint = { x: number; y: number }

export type DentalPrediction = {
  detection_id?: string
  points?: PredictionPoint[]
  x: number
  y: number
  width: number
  height: number
}

export type SelectedRegion = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type ToothSegment = {
  fdi: number
  x: number
  y: number
  width: number
  height: number
  conf?: number
  points?: number[][]
}
