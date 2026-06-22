AWS & Hugging Face setup

1) AWS S3
- Create an S3 bucket and set `AWS_REGION`, `AWS_BUCKET_NAME`.
- Create an IAM user with programmatic access and give it permissions to access the bucket.
- Set `AWS_ACCESS_KEY` and `AWS_SECRET_KEY` in your environment or in a local `.env` file (do NOT commit `.env`).

2) Hugging Face
- Obtain an API key from Hugging Face and set either `HUGGINGFACE_API_KEY` or `HF_API_KEY` in your environment.
- The backend accepts both env var names for compatibility.

3) Example
Create a `backend/.env` (gitignored) with values copied from `.env.example`.

4) Notes
- Keep secrets out of source control. Rotate keys if they were exposed.
- If env vars are missing, the server will warn about S3 configuration; AI calls will fail and return an error message.

5) Presigned upload/download
- The backend now exposes presigned endpoints for direct client S3 uploads and downloads:
	- `POST /api/files/presign/upload` (auth) -> body: `{ fileName, contentType }` returns `{ uploadUrl, s3Key }`.
	- `GET /api/files/:id/presign-download` (auth) -> returns `{ downloadUrl }`.

Usage (client):
1. Request a presigned upload URL with the desired `fileName`.
2. PUT the file bytes to `uploadUrl` with `Content-Type` set.
3. After upload, call your normal `POST /api/files/upload` or create the File DB record referencing the returned `s3Key`.

Security: presigned URLs are short lived (15 minutes) and scoped to the generated `s3Key`.
