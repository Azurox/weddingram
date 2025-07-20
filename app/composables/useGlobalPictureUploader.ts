
export const useGlobalPictureUploader = () => {  
  const isLoading = useState('isLoading', () => false);
  const { uuid } = useRoute().params as { uuid: string };
  
  // We actually don't use the composable, only for the typing. A cleaner way to do it would be appreciated :)
  const { files: _filesType } = useFileStorage()
  type FilesType = typeof _filesType.value
  async function uploadPictures(files: FilesType) {
    isLoading.value = true;
    try {
      const result = await $fetch(`/api/events/${uuid}/upload`, {
        method: 'POST',
        body: {
          files: files,
        }
      })

      console.log("Upload result:", result);
    } catch (error) {
      console.error("Failed to upload pictures:", error);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    uploadPictures,
  }
}
