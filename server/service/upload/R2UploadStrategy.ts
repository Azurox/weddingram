import type { events } from '~~/server/database/schema/event-schema'
import type { ProcessedFileInfo, R2ProcessedFileInfo, UploadResult, UploadStrategy } from './UploadStrategy'
import crypto from 'node:crypto'
import { useDrizzle } from '~~/server/database'
import { medias } from '~~/server/database/schema/media-schema'
import { buildPublicUrl, retrieveFileMetadata } from '~~/server/service/R2Service'

export class R2UploadStrategy implements UploadStrategy {
  requiresPresignedUrls = (): boolean => true

  uploadFiles = async (
    files: ProcessedFileInfo[],
    eventId: string,
    guestId: string,
    event: typeof events.$inferSelect,
  ): Promise<UploadResult[]> => {
    if (event.bucketType !== 'R2') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event does not support R2 uploads',
      })
    }

    const db = useDrizzle()
    const pictureRecords: Array<typeof medias.$inferInsert> = []
    const results: UploadResult[] = []

    for (const fileInfo of files) {
      try {
        const uploadResult = await this.verifyPictureWasUploaded(fileInfo, eventId, guestId)

        if (!uploadResult.success) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Picture was not properly uploaded',
          })
        }

        // For R2 strategy, we need to extract the ID from the filename or generate one
        const pictureId = this.extractPictureIdFromFilename(fileInfo) || crypto.randomUUID()
        const filename = this.getFilenameFromFileInfo(fileInfo)

        if (!filename) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Filename is required for R2 uploads',
          })
        }

        const magicDeleteId = crypto.randomUUID()

        pictureRecords.push({
          filename,
          eventId,
          id: pictureId,
          guestId,
          url: uploadResult.url,
          capturedAt: fileInfo.capturedAt,
          pictureHash: fileInfo.hash,
          size: uploadResult.actualSize,
          magicDeleteId,
          thumbnailUrl: uploadResult.url, // Placeholder, replace with actual thumbnail URL if available
        })

        results.push({
          id: pictureId,
          url: uploadResult.url,
          deleteId: magicDeleteId,
        })
      }
      catch (error) {
        console.error('Error verifying uploaded file:', error)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to verify uploaded file',
        })
      }
    }

    // Batch insert all successfully processed pictures
    if (pictureRecords.length > 0) {
      await db.insert(medias).values(pictureRecords).onConflictDoNothing()
    }

    return results
  }

  private async verifyPictureWasUploaded(
    fileInfo: ProcessedFileInfo,
    eventId: string,
    guestId: string,
  ) {
    if (!this.isR2FileInfo(fileInfo)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'File information does not come from inquiry upload',
      })
    }

    const fileMetadata = await retrieveFileMetadata(fileInfo.filename)
    if (fileMetadata.Metadata && 'eventid' in fileMetadata.Metadata && 'guestid' in fileMetadata.Metadata) {
      if (fileMetadata.Metadata.eventid !== eventId || fileMetadata.Metadata.guestid !== guestId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'File metadata does not match event or guest',
          data: {
            expectedEventId: eventId,
            expectedGuestId: guestId,
            actualEventId: fileMetadata.Metadata.eventid,
            actualGuestId: fileMetadata.Metadata.guestid,
          },
        })
      }
      return {
        success: true,
        actualSize: Number(fileMetadata.ContentLength),
        url: buildPublicUrl(fileInfo.filename),
      }
    }
    else {
      throw createError({
        statusCode: 400,
        statusMessage: 'File metadata is missing eventId or guestId',
      })
    }
  }

  private isR2FileInfo(fileInfo: ProcessedFileInfo): fileInfo is R2ProcessedFileInfo {
    return (
      typeof fileInfo === 'object'
      && fileInfo !== null
      && 'filename' in fileInfo
      && 'id' in fileInfo
      && typeof (fileInfo as { filename?: unknown }).filename === 'string'
      && typeof (fileInfo as { id?: unknown }).id === 'string'
    )
  }

  private getFilenameFromFileInfo(fileInfo: ProcessedFileInfo): string | undefined {
    return this.isR2FileInfo(fileInfo) ? fileInfo.filename : undefined
  }

  private extractPictureIdFromFilename(fileInfo: ProcessedFileInfo): string | undefined {
    return this.isR2FileInfo(fileInfo) ? fileInfo.id : undefined
  }
}
