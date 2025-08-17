export function downloadAsBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.hidden = true
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}
