export interface DeletionStrategy {
  deleteFile: (filename: string, eventId: string) => Promise<{ success: boolean }>
}

export interface PictureToDelete {
  url: string
  filename: string
  magicDeleteId: string
}
