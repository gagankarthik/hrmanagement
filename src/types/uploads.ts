// A document stored in S3 and referenced from a record.
export interface UploadedDoc {
  name: string;
  key: string;
  contentType?: string;
  size?: number;
  uploadedAt: string;
}
