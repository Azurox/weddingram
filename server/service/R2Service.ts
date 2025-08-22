import type { ServerFile } from 'nuxt-file-storage'
import { Buffer } from 'node:buffer'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

function createS3Client() {
  const config = useRuntimeConfig()

  const S3 = new S3Client({
    region: 'auto',
    endpoint: config.R2EnpointS3,
    credentials: {
      accessKeyId: config.R2AccessKeyId,
      secretAccessKey: config.R2SecretAccessKey,
    },
  })

  return S3
}

export function buildPublicUrl(r2FilePath: string) {
  const config = useRuntimeConfig()
  const mergedUrl = new URL(r2FilePath, config.R2PublicUrl)
  return mergedUrl.toString()
}

export async function persistPublicFile(name: string, file: ServerFile, metadata: Record<string, string> = {}) {
  const S3 = createS3Client()

  await S3.send(new PutObjectCommand({
    Bucket: useRuntimeConfig().R2BucketName,
    Key: name,
    Body: Buffer.from(file.content.replace(/^data:image\/\w+;base64,/, ''), 'base64'),
    ContentType: file.type,
    ContentEncoding: 'base64',
    ACL: 'public-read',
    Metadata: metadata,
  }))

  return buildPublicUrl(name)
}

export function retrieveFile(name: string) {
  const S3 = createS3Client()
  const config = useRuntimeConfig()

  return S3.send(new GetObjectCommand({
    Bucket: config.R2BucketName,
    Key: name,
  }))
}
