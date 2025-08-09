import type { Ref } from 'vue'

export interface FileStorageFile {
  name: string
  size: number
  type: string
  content: ArrayBuffer
  lastModified: number
  stream(): ReadableStream<Uint8Array>
  text(): Promise<string>
  arrayBuffer(): Promise<ArrayBuffer>
}

export const useFileStorage = () => {
  const files: Ref<FileStorageFile[]> = ref([])

  const handleFileInput = async (event: { target?: { files?: FileList | null } } | { files?: FileList | null }) => {
    const fileList = ('target' in event && event.target?.files) || ('files' in event && event.files)
    if (!fileList) return

    const fileArray: FileStorageFile[] = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (!file) continue
      
      const arrayBuffer = await file.arrayBuffer()
      
      const fileStorageFile: FileStorageFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        content: arrayBuffer,
        lastModified: file.lastModified,
        stream: () => file.stream(),
        text: () => file.text(),
        arrayBuffer: () => file.arrayBuffer()
      }
      
      fileArray.push(fileStorageFile)
    }
    
    files.value = fileArray
  }

  return {
    files,
    handleFileInput
  }
}
