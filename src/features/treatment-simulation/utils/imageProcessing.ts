import type { SelectedRegion } from '@/features/dental-analysis/model/types'

const loadImage = (src: string) => new Promise<HTMLImageElement>(resolve => {
  const image = new window.Image()
  image.onload = () => resolve(image)
  image.src = src
})

export async function darkenOutsideRegion(base64: string, region: SelectedRegion, dimFactor = 0.22): Promise<string> {
  const image = await loadImage(base64)
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, image.width, image.height)
  const { data } = imageData
  const x1 = Math.round(region.x1 * image.width)
  const y1 = Math.round(region.y1 * image.height)
  const x2 = Math.round(region.x2 * image.width)
  const y2 = Math.round(region.y2 * image.height)
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (x >= x1 && x < x2 && y >= y1 && y < y2) continue
      const index = (y * image.width + x) * 4
      data[index] = Math.round(data[index] * dimFactor)
      data[index + 1] = Math.round(data[index + 1] * dimFactor)
      data[index + 2] = Math.round(data[index + 2] * dimFactor)
    }
  }
  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export async function compositeRegion(originalBase64: string, resultBase64: string, region: SelectedRegion): Promise<string> {
  const [original, result] = await Promise.all([loadImage(originalBase64), loadImage(resultBase64)])
  const canvas = document.createElement('canvas')
  canvas.width = original.width
  canvas.height = original.height
  const context = canvas.getContext('2d')!
  context.drawImage(original, 0, 0)
  context.drawImage(result, region.x1 * result.width, region.y1 * result.height, (region.x2 - region.x1) * result.width, (region.y2 - region.y1) * result.height, region.x1 * original.width, region.y1 * original.height, (region.x2 - region.x1) * original.width, (region.y2 - region.y1) * original.height)
  return canvas.toDataURL('image/png')
}

export async function normalizeBrightness(originalBase64: string, resultBase64: string): Promise<string> {
  const [original, result] = await Promise.all([loadImage(originalBase64), loadImage(resultBase64)])
  const width = Math.min(original.width, 300)
  const height = Math.min(original.height, 300)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const brightness = (image: HTMLImageElement) => {
    context.clearRect(0, 0, width, height)
    context.drawImage(image, (image.width - width) / 2, (image.height - height) / 2, width, height, 0, 0, width, height)
    const data = context.getImageData(0, 0, width, height).data
    let sum = 0
    for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    return sum / (data.length / 4)
  }
  const factor = Math.min(brightness(original) / Math.max(brightness(result), 1), 1.5)
  if (Math.abs(factor - 1) < 0.03) return resultBase64
  canvas.width = result.width
  canvas.height = result.height
  context.drawImage(result, 0, 0)
  const imageData = context.getImageData(0, 0, result.width, result.height)
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = Math.min(255, imageData.data[i] * factor)
    imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] * factor)
    imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] * factor)
  }
  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
