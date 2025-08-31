import type { DeletionStrategy } from './DeletionStrategy'
import { getUploadedPictureFolder } from '~~/server/service/ImageService'

export class FilesystemDeletionStrategy implements DeletionStrategy {
  deleteFile = async (filename: string, eventId: string): Promise<{ success: boolean }> => {
    try {
      await deleteFile(filename, getUploadedPictureFolder(eventId))
      return { success: true }
    }
    catch (error) {
      console.error('Error deleting file from filesystem:', error)
      throw error
    }
  }
}
