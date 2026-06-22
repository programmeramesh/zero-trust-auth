const { S3Client } = require("@aws-sdk/client-s3");

if (!process.env.AWS_REGION || !process.env.AWS_BUCKET_NAME || !process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_KEY) {
  console.warn('S3 configuration: missing AWS env vars (AWS_REGION, AWS_BUCKET_NAME, AWS_ACCESS_KEY, AWS_SECRET_KEY). S3 operations will fail until configured.');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports = s3;