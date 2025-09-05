import type { ServerFile } from 'nuxt-file-storage'
import type { events } from '~~/server/database/schema/event-schema'
import type { ProcessedFileInfo, UploadResult, UploadStrategy } from './UploadStrategy'
import crypto from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { useDrizzle } from '~~/server/database'
import { medias } from '~~/server/database/schema/media-schema'
import { buildFilesystemUploadedPictureUrl, buildFilesystemUploadedThumbnailUrl, getUploadedPictureFolder, getUploadedThumbnailFolder, isMediaVideoContent, isValidMediaContent } from '~~/server/service/ImageService'
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
    const fileInfoMap = new Map<string, { fileInfo: ProcessedFileInfo, mediaId: string, url: string, thumbnailUrl: string | null, deleteId: string, isVideo: boolean }>()

    const invalidFiles: Array<{ hash: string, reason: string }> = []
    const validFiles: ProcessedFileInfo[] = []

    for (const fileInfo of files) {
      if (!fileInfo.file) {
        throw createError({
          statusCode: 400,
          statusMessage: 'File data is required for filesystem uploads',
        })
      }

      if (!isValidMediaContent(fileInfo.contentType)) {
        invalidFiles.push({ hash: fileInfo.hash, reason: 'Invalid file type' })
        continue
      }

      validFiles.push(fileInfo)
    }

    if (invalidFiles.length > 0) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Some files are invalid',
        data: {
          duplicates: [],
          invalidFiles,
          uploaded: [],
        },
      })
    }

    for (const fileInfo of validFiles) {
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

        const isVideo = isMediaVideoContent(fileInfo.contentType)

        let thumbnailUrl: string | null = null
        let thumbnailSize = 0

        if (!isVideo) {
          const thumbnailResult = await this.generateAndSaveThumbnail(
            eventId,
            mediaId,
            fileInfo.file as ServerFile,
          )
          thumbnailUrl = thumbnailResult.url
          thumbnailSize = thumbnailResult.size
        }

        const magicDeleteId = crypto.randomUUID()

        const recordToInsert = {
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
        } as const

        pictureRecords.push(recordToInsert)

        fileInfoMap.set(fileInfo.hash, {
          fileInfo,
          mediaId,
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

    // Batch insert all successfully processed pictures with conflict handling
    const insertedRecords = await db.insert(medias).values(pictureRecords).onConflictDoNothing().returning({
      id: medias.id,
      pictureHash: medias.pictureHash,
    })

    const results: UploadResult[] = []
    const insertedHashes = new Set(insertedRecords.map(record => record.pictureHash))

    for (const record of insertedRecords) {
      const mappedData = fileInfoMap.get(record.pictureHash)
      if (mappedData) {
        results.push({
          id: mappedData.mediaId,
          url: mappedData.url,
          thumbnailUrl: mappedData.thumbnailUrl,
          deleteId: mappedData.deleteId,
          isVideo: mappedData.isVideo,
        })
      }
    }

    const duplicateHashes = files
      .map(f => f.hash)
      .filter(hash => !insertedHashes.has(hash))

    if (duplicateHashes.length > 0) {
      const duplicates = duplicateHashes.map(hash => ({
        hash,
      }))

      throw createError({
        statusCode: 422,
        statusMessage: 'Some files are duplicates',
        data: {
          duplicates,
          invalidFiles: [],
          uploaded: results,
        },
      })
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

  private async generateAndSaveThumbnail(eventId: string, pictureId: string, file: ServerFile) {
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
