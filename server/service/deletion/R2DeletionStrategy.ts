import type { DeletionStrategy } from './DeletionStrategy'
import { deleteFile } from '~~/server/service/R2Service'

export class R2DeletionStrategy implements DeletionStrategy {
  deleteFile = async (filename: string, _eventId: string): Promise<{ success: boolean }> => {
    try {
      return await deleteFile(filename)
    }
    catch (error) {
      console.error('Error deleting file from R2:', error)
      throw error
    }
  }
}
