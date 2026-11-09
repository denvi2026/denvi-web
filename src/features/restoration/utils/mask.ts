import type { SelectedRegion } from '@/features/dental-analysis/model/types'

export type PixelRect = { x: number; y: number; width: number; height: number }

const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

/** Converts the normalized selection to an integer rectangle in source-image pixels. */
export function normalizedRegionToPixelRect(region: SelectedRegion, imageWidth: number, imageHeight: number): PixelRect | null {
  if (!Number.isInteger(imageWidth) || !Number.isInteger(imageHeight) || imageWidth < 1 || imageHeight < 1) return null
  const left = Math.min(clamp(region.x1), clamp(region.x2))
  const right = Math.max(clamp(region.x1), clamp(region.x2))
  const top = Math.min(clamp(region.y1), clamp(region.y2))
  const bottom = Math.max(clamp(region.y1), clamp(region.y2))
  const x = Math.floor(left * imageWidth)
  const y = Math.floor(top * imageHeight)
  const endX = Math.ceil(right * imageWidth)
  const endY = Math.ceil(bottom * imageHeight)
  if (endX <= x || endY <= y) return null
  return { x, y, width: endX - x, height: endY - y }
}

export async function createRestorationMask(width: number, height: number, region: SelectedRegion): Promise<Blob> {
  const selected = normalizedRegionToPixelRect(region, width, height)
  if (!selected) throw new Error('복원할 유효한 선택 영역이 없습니다.')
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('마스크 캔버스를 만들 수 없습니다.')
  context.fillStyle = '#000000'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#ffffff'
  context.fillRect(selected.x, selected.y, selected.width, selected.height)
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG 마스크 생성에 실패했습니다.')), 'image/png'))
}

export async function dataUrlToImageFile(dataUrl: string): Promise<{ file: File; image: HTMLImageElement }> {
  const [metadata] = dataUrl.split(',', 1)
  const mimeType = /^data:([^;,]+)/.exec(metadata)?.[1] || 'image/png'
  const blob = await (await fetch(dataUrl)).blob()
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const extension = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png'
  return { file: new File([blob], `restoration-source.${extension}`, { type: mimeType }), image }
}
