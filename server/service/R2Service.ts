import type { ServerFile } from 'nuxt-file-storage'
import { Buffer } from 'node:buffer'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function createS3Client() {
  const config = useRuntimeConfig()

  return new S3Client({
    region: 'auto',
    endpoint: config.R2EndpointS3,
    credentials: {
      accessKeyId: config.R2AccessKeyId,
      secretAccessKey: config.R2SecretAccessKey,
    },
  })
}

export function buildPublicUrl(r2FilePath: string) {
  const config = useRuntimeConfig()
  const mergedUrl = new URL(r2FilePath, config.R2PublicUrl)
  return mergedUrl.toString()
}

export async function persistPublicPictureFile(name: string, file: ServerFile, metadata: Record<string, string> = {}) {
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

export function retrieveFileMetadata(name: string) {
  const S3 = createS3Client()
  const config = useRuntimeConfig()

  return S3.send(new GetObjectCommand({
    Bucket: config.R2BucketName,
    Key: name,
  }))
}

export async function getPresignedUploadUrl(name: string, contentType: string, contentLength: number, metadata: Record<string, string> = {}, customerHeaders: Record<string, string> = {}) {
  const S3 = createS3Client()

  const command = new PutObjectCommand({
    Bucket: useRuntimeConfig().R2BucketName,
    Key: name,
    ContentType: contentType,
    Metadata: metadata,
  })

  return await getSignedUrl(S3, command, { expiresIn: 3600, unhoistableHeaders: new Set(Object.keys(customerHeaders)) })
}
