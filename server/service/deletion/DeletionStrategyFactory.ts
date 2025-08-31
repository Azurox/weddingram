import type { EventBucketType } from '~~/server/database/schema/event-schema'
import type { DeletionStrategy } from './DeletionStrategy'
import { FilesystemDeletionStrategy } from './FilesystemDeletionStrategy'
import { R2DeletionStrategy } from './R2DeletionStrategy'

export class DeletionStrategyFactory {
  static create(bucketType: EventBucketType): DeletionStrategy {
    switch (bucketType) {
      case 'filesystem':
        return new FilesystemDeletionStrategy()
      case 'R2':
        return new R2DeletionStrategy()
      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unsupported storage type: ${bucketType}`,
        })
    }
  }
}
