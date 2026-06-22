Frontend presigned upload example (React + fetch)

Usage:
1. Call `filesAPI.presignUpload({ fileName, contentType })` to receive `{ uploadUrl, s3Key }`.
2. PUT the file bytes to `uploadUrl`.
3. Call `filesAPI.completeUpload({ s3Key, fileName, fileSize, salt, iv, textContent })` to create DB record and run analysis.

Example code:

```ts
import { filesAPI } from './services/api';

async function uploadFile(file: File, extra = {}) {
  // 1) get presigned URL
  const { data: presign } = await filesAPI.presignUpload({ fileName: file.name, contentType: file.type });
  const { uploadUrl, s3Key } = presign;

  // 2) PUT file bytes directly to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // 3) Notify server to create DB record
  const payload = {
    s3Key,
    fileName: file.name,
    fileSize: file.size,
    textContent: extra.textContent || file.name,
    // optional: salt, iv if you're encrypting client-side
  };

  const { data: result } = await filesAPI.completeUpload(payload);
  return result;
}
```
