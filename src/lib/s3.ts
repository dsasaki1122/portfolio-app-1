import "server-only";

import { randomUUID } from "crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// 認証情報は明示せず AWS SDK のデフォルトプロバイダーチェーンに解決させる
// （本番: ECS タスクロール / ローカル開発: ~/.aws/credentials 等）。
const region = process.env.AWS_REGION;
const bucketName = process.env.S3_BUCKET_NAME;

const s3 = new S3Client({ region });

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// uploadRestaurantImage が生成するキーの形式のみ許可する。
// クライアントから任意のキーを渡されてバケット内の他オブジェクトを
// 削除・取得されてしまわないようにするためのガード。
export const RESTAURANT_IMAGE_KEY_PATTERN =
  /^restaurants\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/;

export type UploadedImage = { url: string; key: string };

/**
 * レストラン画像を S3 にアップロードし、閲覧用URLとオブジェクトキーを返す。
 * バケットは非公開のため、閲覧用URLは直接のS3 URLではなく /api/images 経由の
 * 自アプリのパスを返す（実体は getRestaurantImage が IAM 資格情報で取得する）。
 */
export async function uploadRestaurantImage(
  file: File,
): Promise<UploadedImage> {
  if (!region || !bucketName) {
    throw new Error("AWS_REGION and S3_BUCKET_NAME must be set");
  }

  const ext = ALLOWED_CONTENT_TYPES[file.type];
  if (!ext) {
    throw new Error("unsupported image type");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("file is too large (max 5MB)");
  }

  const key = `restaurants/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  return { url: `/api/images/${key}`, key };
}

export type RestaurantImage = { body: Uint8Array; contentType: string };

/**
 * uploadRestaurantImage でアップロードしたレストラン画像を S3 から取得する。
 * PUT/DELETE と同じ IAM 資格情報で認証済みGETを行い、/api/images ルートから
 * バイト列を返すために使う（バケット自体は非公開のまま）。
 */
export async function getRestaurantImage(key: string): Promise<RestaurantImage> {
  if (!region || !bucketName) {
    throw new Error("AWS_REGION and S3_BUCKET_NAME must be set");
  }
  if (!RESTAURANT_IMAGE_KEY_PATTERN.test(key)) {
    throw new Error("invalid image key");
  }

  const result = await s3.send(
    new GetObjectCommand({ Bucket: bucketName, Key: key }),
  );

  if (!result.Body) {
    throw new Error("image body is empty");
  }

  return {
    body: await result.Body.transformToByteArray(),
    contentType: result.ContentType ?? "application/octet-stream",
  };
}

/**
 * uploadRestaurantImage でアップロードしたレストラン画像を S3 から削除する。
 */
export async function deleteRestaurantImage(key: string): Promise<void> {
  if (!region || !bucketName) {
    throw new Error("AWS_REGION and S3_BUCKET_NAME must be set");
  }
  if (!RESTAURANT_IMAGE_KEY_PATTERN.test(key)) {
    throw new Error("invalid image key");
  }

  await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}
