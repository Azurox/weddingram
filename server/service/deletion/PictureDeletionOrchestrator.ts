import type { events } from '~~/server/database/schema/event-schema'
import type { PictureToDelete } from './DeletionStrategy'
import { DeletionStrategyFactory } from './DeletionStrategyFactory'

export class PictureDeletionOrchestrator {
  /**
   * Delete pictures using the appropriate strategy based on event bucket type
   */
  static async deletePictures(
    picturesToDelete: PictureToDelete[],
    event: typeof events.$inferSelect,
  ): Promise<{ success: boolean, deletedCount: number, errors: string[] }> {
    const strategy = DeletionStrategyFactory.create(event.bucketType)
    const errors: string[] = []
    let deletedCount = 0

    // Process deletions in parallel for better performance
    const deletePromises = picturesToDelete.map(async (picture) => {
      try {
        await strategy.deleteFile(picture.filename, event.id)
        deletedCount++
        return { success: true, picture }
      }
      catch (error) {
        const errorMessage = `Failed to delete ${picture.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMessage)
        return { success: false, picture, error: errorMessage }
      }
    })

    const results = await Promise.allSettled(deletePromises)

    // Count successful deletions
    deletedCount = results.filter(result =>
      result.status === 'fulfilled' && result.value.success,
    ).length

    // Collect errors from failed deletions
    results.forEach((result) => {
      if (result.status === 'rejected') {
        errors.push(`Deletion failed: ${result.reason}`)
      }
      else if (!result.value.success && result.value.error) {
        errors.push(result.value.error)
      }
    })

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    }
  }
}
