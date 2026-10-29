/* Ported from PWA/src/lib/image.ts. The photo is compressed once, on pick.
   The ORIGINAL compressed image is what gets sent; the crop is four numbers,
   never a second file. */

export interface CompressedPhoto {
  base64: string
  dataUrl: string
  name: string
}

export function compressImage(file: File, maxSize = 1600, quality = 0.7): Promise<CompressedPhoto> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        if (img.width <= 0 || img.height <= 0) {
          reject(new Error('Dimensi foto tidak valid. Pilih foto lain.'))
          return
        }

        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Browser gagal memproses kanvas gambar.'))
          return
        }

        // White fill so a transparent PNG doesn't turn black.
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const commaIndex = dataUrl.indexOf(',')
        const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : ''

        if (!base64) {
          reject(new Error('Gagal mengonversi foto ke format JPEG.'))
          return
        }

        resolve({ base64, dataUrl, name: file.name })
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Gagal mengompres foto nota.'))
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Format foto tidak didukung atau file rusak. Gunakan foto JPEG atau PNG.'))
    }

    img.src = objectUrl
  })
}
