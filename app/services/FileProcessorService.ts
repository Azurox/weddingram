import type { ClientFile } from 'nuxt-file-storage'
import ExifReader from 'exifreader'

export interface FileProcessingResult {
  hash: string
  capturedAt: Date
  file: ClientFile
}

export class FileProcessorService {
  /**
   * Calculate SHA-256 hash of a file
   */
  static async calculateFileHash(file: ClientFile): Promise<string> {
    if (!file.content) {
      throw new Error('File content is not available')
    }
    if (typeof file.content !== 'string') {
      throw new TypeError('File content is not a string')
    }
    // Convert string content to ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(file.content) // file.content is a data URL
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  /**
   * Extract EXIF data from a file
   */
  static async extractExifData(file: ClientFile) {
    try {
      const tags = await ExifReader.load(file.content as string)

      let capturedAt = new Date()
      if (tags.DateTimeOriginal) {
        const [year, month, date, hour, min, sec] = tags.DateTimeOriginal.description.split(/\D/)
        capturedAt = new Date(Number(year), Number(month) - 1, Number(date), Number(hour), Number(min), Number(sec))
      }

      return { capturedAt }
    }
    catch (error) {
      console.error('Error extracting EXIF data:', error)
      return {
        capturedAt: new Date(), // Fallback to current date if EXIF data extraction fails
      }
    }
  }

  /**
   * Process a single file (hash + EXIF)
   */
  static async processFile(file: ClientFile): Promise<FileProcessingResult> {
    const hash = await this.calculateFileHash(file)
    const { capturedAt } = await this.extractExifData(file)
    return { hash, capturedAt, file }
  }

  /**
   * Process multiple files in parallel
   */
  static async processFiles(files: ClientFile[]): Promise<FileProcessingResult[]> {
    return Promise.all(files.map(file => this.processFile(file)))
  }
}
