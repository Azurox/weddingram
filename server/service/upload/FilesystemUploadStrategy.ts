import type { ServerFile } from 'nuxt-file-storage'
import type { events } from '~~/server/database/schema/event-schema'
import type { ProcessedFileInfo, UploadResult, UploadStrategy } from './UploadStrategy'
import crypto from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { useDrizzle } from '~~/server/database'
import { medias } from '~~/server/database/schema/media-schema'
import { buildFilesystemUploadedPictureUrl, buildFilesystemUploadedThumbnailUrl, getUploadedPictureFolder, getUploadedThumbnailFolder } from '~~/server/service/ImageService'
import { THUMBNAIL_PROPERTY } from '~~/shared/utils/constants'

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
        const mediaId = crypto.randomUUID()
        const { url, filename } = await this.savePictureInLocalBucket(
          eventId,
          mediaId,
          fileInfo.file as ServerFile,
        )

        const isVideo = (fileInfo.contentType || '').startsWith('video/')

        let thumbnailUrl: string | null = null
        let thumbnailSize = 0

        if (!isVideo) {
          const thumbnailResult = await this.generateAndSaveThumbnail(
            eventId,
            mediaId,
            fileInfo.file as ServerFile,
            isVideo,
          )
          thumbnailUrl = thumbnailResult.url
          thumbnailSize = thumbnailResult.size
        }

        const magicDeleteId = crypto.randomUUID()

        pictureRecords.push({
          filename,
          eventId,
          id: mediaId,
          guestId,
          url,
          thumbnailUrl: thumbnailUrl ?? null,
          capturedAt: fileInfo.capturedAt,
          pictureHash: fileInfo.hash,
          size: Number((fileInfo.file as ServerFile).size + thumbnailSize),
          magicDeleteId,
          mediaType: isVideo ? 'video' : 'picture',
        })

        results.push({
          id: mediaId,
          url,
          thumbnailUrl,
          deleteId: magicDeleteId,
          isVideo,
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
  ) {
    const filename = await storeFileLocally(
      file,
      pictureId,
      getUploadedPictureFolder(eventId),
    )

    return {
      url: buildFilesystemUploadedPictureUrl(eventId, filename),
      filename,
    }
  }

  private async generateAndSaveThumbnail(eventId: string, pictureId: string, file: ServerFile, isVideo: boolean) {
    if (isVideo) {
      return { url: 'TODO', size: 0 } // TODO
    }

    const folderUrl = getUploadedThumbnailFolder(eventId)
    const filename = `${pictureId}.avif`

    await mkdir(folderUrl, { recursive: true })

    const url = path.join(folderUrl, filename)

    const { binaryString } = parseDataUrl(file.content)
    const thumbnailFile = await sharp(binaryString).resize(THUMBNAIL_PROPERTY.WIDTH, THUMBNAIL_PROPERTY.HEIGHT, { fit: 'inside' }).avif({ quality: THUMBNAIL_PROPERTY.QUALITY }).toFile(url)

    return {
      url: buildFilesystemUploadedThumbnailUrl(eventId, filename),
      size: thumbnailFile.size,
    }
  }
}
