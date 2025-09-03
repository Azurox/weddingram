import type { ServerFile } from 'nuxt-file-storage'
import type { events } from '~~/server/database/schema/event-schema'
import type { ProcessedFileInfo, R2ProcessedFileInfo, UploadResult } from './UploadStrategy'
import { clearEventPictureCountCache } from '~~/server/service/EventService'
import { UploadStrategyFactory } from './UploadStrategyFactory'

export class PictureUploadOrchestrator {
  static async uploadPictures(
    files: ProcessedFileInfo[],
    eventId: string,
    guestId: string,
    event: typeof events.$inferSelect,
  ): Promise<UploadResult[]> {
    const strategy = UploadStrategyFactory.create(event.bucketType)

    const results = await strategy.uploadFiles(files, eventId, guestId, event)

    // Clear cache for event picture count
    if (results.length > 0) {
      await clearEventPictureCountCache(eventId)
    }

    return results
  }

  static createFromServerFiles(
    files: ServerFile[],
    fileInformations: Array<{ hash: string, capturedAt?: Date }>,
  ): ProcessedFileInfo[] {
    if (files.length !== fileInformations.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Files count does not match file informations count',
      })
    }

    return files.map((file, index) => {
      const fileInfo = fileInformations[index]
      if (!fileInfo) {
        throw createError({
          statusCode: 400,
          statusMessage: `Missing file information for file at index ${index}`,
        })
      }

      return {
        hash: fileInfo.hash,
        extension: this.getFileExtension(file.name || ''),
        contentType: file.type || 'unknown',
        length: Number(file.size),
        capturedAt: fileInfo.capturedAt,
        file,
      }
    })
  }

  static createFromR2Inquiry(
    fileInformations: Array<{
      hash: string
      extension: string
      contentType: string
      length: number
      id: string
      filename: string
      filekey: string
      capturedAt?: Date
      thumbnailFilekey: string | null
    }>,
  ): R2ProcessedFileInfo[] {
    return fileInformations.map(info => ({
      hash: info.hash,
      extension: info.extension,
      contentType: info.contentType,
      length: info.length,
      capturedAt: info.capturedAt,
      id: info.id,
      filename: info.filename,
      filekey: info.filekey,
      file: undefined,
      thumbnailFilekey: info.thumbnailFilekey,
    }))
  }

  private static getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex === -1 ? '' : filename.slice(lastDotIndex + 1)
  }
}
