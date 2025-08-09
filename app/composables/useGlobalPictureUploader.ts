
export const useGlobalPictureUploader = () => {  
  const isLoading = useState('isLoading', () => false);
  const { uuid } = useRoute().params as { uuid: string };
  
  // We actually don't use the composable, only for the typing. A cleaner way to do it would be appreciated :)
  const { files: _filesType } = useFileStorage()
  type FilesType = typeof _filesType.value
  // Helper function to calculate SHA-256 hash of a file
  async function calculateFileHash(file: FilesType[0]): Promise<string> {
    if (!file.content) {
      throw new Error('File content is not available');
    }
    if (typeof file.content !== 'string') {
      throw new Error('File content is not a string');
    }
    // Convert string content to ArrayBuffer
    const encoder = new TextEncoder();
    const arrayBuffer = encoder.encode(file.content).buffer;
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  async function uploadPictures(files: FilesType) {
    isLoading.value = true;

    const filesInformations: { hash: string }[] = []
    
    // Calculate hash for each file
    for (const file of files) {
      const hash = await calculateFileHash(file);
      filesInformations.push({ hash });
    }

    try {
      const result = await $fetch(`/api/events/single/${uuid}/upload`, {
        method: 'POST',
        body: {
          files: files,
          filesInformations: filesInformations
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
    calculateFileHash,
  }
}
