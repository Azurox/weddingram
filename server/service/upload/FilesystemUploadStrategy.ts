import type { ServerFile } from 'nuxt-file-storage'
import type { events } from '~~/server/database/schema/event-schema'
import type { ProcessedFileInfo, UploadResult, UploadStrategy } from './UploadStrategy'
import crypto from 'node:crypto'
import { useDrizzle } from '~~/server/database'
import { medias } from '~~/server/database/schema/media-schema'
import { buildUploadedPictureUrl, getUploadedPictureFolder } from '~~/server/service/ImageService'

export class FilesystemUploadStrategy implements UploadStrategy {
  requiresPresignedUrls = (): boolean => false

  uploadFiles = async (
    files: ProcessedFileInfo[],
    eventId: string,
    guestId: string,
    event: typeof events.$inferSelect,
  ): Promise<UploadResult[]> => {
    if (event.bucketType !== 'filesystem') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event does not support filesystem uploads',
      })
    }

    const db = useDrizzle()
    const pictureRecords: Array<typeof medias.$inferInsert> = []
    const results: UploadResult[] = []

    for (const fileInfo of files) {
      if (!fileInfo.file) {
        throw createError({
          statusCode: 400,
          statusMessage: 'File data is required for filesystem uploads',
        })
      }

      try {
        const pictureId = crypto.randomUUID()
        const { url, filename } = await this.savePictureInLocalBucket(
          eventId,
          pictureId,
          fileInfo.file as ServerFile,
          guestId,
          event,
        )

        const magicDeleteId = crypto.randomUUID()

        pictureRecords.push({
          filename,
          eventId,
          id: pictureId,
          guestId,
          url,
          thumbnailUrl: url, // TODO  replace
          capturedAt: fileInfo.capturedAt,
          pictureHash: fileInfo.hash,
          size: Number((fileInfo.file as ServerFile).size),
          magicDeleteId,
        })

        results.push({
          id: pictureId,
          url,
          deleteId: magicDeleteId,
        })
      }
      catch (error) {
        console.error('Error processing file:', error)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to process file',
        })
      }
    }

    // Batch insert all successfully processed pictures
    if (pictureRecords.length > 0) {
      await db.insert(medias).values(pictureRecords).onConflictDoNothing()
    }

    return results
  }

  private async savePictureInLocalBucket(
    eventId: string,
    pictureId: string,
    file: ServerFile,
    guestId: string,
    event: typeof events.$inferSelect,
  ) {
    if (event.bucketType === 'filesystem') {
      const filename = await storeFileLocally(
        file,
        pictureId,
        getUploadedPictureFolder(eventId),
      )

      return {
        url: buildUploadedPictureUrl(eventId, filename),
        filename,
      }
    }
    else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Event with R2 bucket type does not support direct upload',
      })
    }
  }
}
