import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 Client (S3-compatible)
 *
 * R2 is S3-compatible, so we use AWS SDK S3 client.
 * Configuration uses R2-specific endpoint and credentials.
 *
 * Environment variables required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 *
 * @see docs/R2_SETUP.md for setup instructions
 */

let r2Client: S3Client | null = null;

/**
 * Get or create R2 client instance (singleton)
 *
 * @returns Configured S3Client for R2
 * @throws Error if environment variables are not set
 */
export function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  // Validate environment variables
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 configuration missing. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables. See docs/R2_SETUP.md"
    );
  }

  // Create S3 client with R2 endpoint
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

/**
 * Helper: Generate presigned URL for PUT (upload)
 *
 * @param params - PutObject parameters
 * @returns Presigned upload URL
 */
export async function getSignedUploadUrl(
  params: Omit<PutObjectCommandInput, "Bucket"> & { Bucket?: string }
): Promise<string> {
  const client = getR2Client();
  const bucketName = params.Bucket || process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new PutObjectCommand({
    ...params,
    Bucket: bucketName,
  });

  return getSignedUrl(client, command, { expiresIn: 900 }); // 15 minutes
}

/**
 * Helper: Generate presigned URL for GET (download)
 *
 * @param params - GetObject parameters
 * @returns Presigned download URL
 */
export async function getSignedDownloadUrl(
  params: Omit<GetObjectCommandInput, "Bucket"> & { Bucket?: string }
): Promise<string> {
  const client = getR2Client();
  const bucketName = params.Bucket || process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new GetObjectCommand({
    ...params,
    Bucket: bucketName,
  });

  return getSignedUrl(client, command, { expiresIn: 3600 }); // 1 hour
}

/**
 * Helper: Delete object from R2
 *
 * @param params - DeleteObject parameters
 * @returns Delete response
 */
export async function deleteR2Object(
  params: Omit<DeleteObjectCommandInput, "Bucket"> & { Bucket?: string }
) {
  const client = getR2Client();
  const bucketName = params.Bucket || process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new DeleteObjectCommand({
    ...params,
    Bucket: bucketName,
  });

  return client.send(command);
}

/**
 * Type-safe wrapper around S3Client for common R2 operations
 */
export const r2 = {
  /**
   * Get S3Client instance
   */
  client: getR2Client,

  /**
   * Generate presigned upload URL
   */
  getUploadUrl: getSignedUploadUrl,

  /**
   * Generate presigned download URL
   */
  getDownloadUrl: getSignedDownloadUrl,

  /**
   * Delete object
   */
  deleteObject: deleteR2Object,
};
