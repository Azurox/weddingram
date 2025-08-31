import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { UploadStrategy } from './UploadStrategy'
import { FilesystemUploadStrategy } from './FilesystemUploadStrategy'
import { R2UploadStrategy } from './R2UploadStrategy'

export class UploadStrategyFactory {
  static create(bucketType: EventBucketType): UploadStrategy {
    switch (bucketType) {
      case 'filesystem':
        return new FilesystemUploadStrategy()
      case 'R2':
        return new R2UploadStrategy()
      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unsupported storage type: ${bucketType}`,
        })
    }
  }
}
