import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StoragePutOptions {
  key: string;
  contentType?: string;
  body: Uint8Array | Buffer | ArrayBuffer;
}

export interface StorageService {
  put(opts: StoragePutOptions): Promise<{ key: string }>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  getBytes(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const R2_ENDPOINT = getEnv("R2_ENDPOINT", "http://localhost:9000");
const R2_BUCKET = getEnv("R2_BUCKET", "idna-dev");
const R2_REGION = process.env.R2_REGION || "auto"; // R2 ignores region but SDK requires a value

const s3 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: getEnv("R2_ACCESS_KEY_ID", "minio"),
    secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", "miniopass"),
  },
  forcePathStyle: true, // R2 works well with path-style addressing
});

export const storage: StorageService = {
  async put({ key, body, contentType }: StoragePutOptions) {
    const Body = body instanceof ArrayBuffer ? new Uint8Array(body) : body;
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body,
        ContentType: contentType || "application/octet-stream",
      }),
    );
    return { key };
  },
  async getSignedUrl(key: string, expiresIn = 900) {
    const url = await s3GetSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
      { expiresIn },
    );
    return url;
  },
  async delete(key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  },
  async getBytes(key: string) {
    const res = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    const body = (res as any).Body;
    if (!body) return new Uint8Array();
    if (typeof (body as any).transformToByteArray === "function") {
      return await (body as any).transformToByteArray();
    }
    // Node stream fallback
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return new Uint8Array(Buffer.concat(chunks));
  },
};

export function buildAssessmentKey(params: {
  studentUserId: string;
  typeSlug: string;
  filename: string;
}) {
  const ext = params.filename.includes(".")
    ? params.filename.split(".").pop()!
    : "bin";
  const ts = new Date().toISOString().replaceAll(":", "-");
  const rand = Math.random().toString(36).slice(2, 8);
  return `assessments/${params.studentUserId}/${params.typeSlug}/${ts}-${rand}.${ext}`;
}
