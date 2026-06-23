const express = require("express");
const router = express.Router();
const File = require("../models/File");
const authMiddleware = require("../middleware/authMiddleware");
const s3 = require("../config/s3");
const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  generateSummary,
  analyzeSecurity,
  generateTags,
  autoRename,
  checkDuplicate,
} = require("../Utils/ai");

// ─────────────────────────────────────────
// POST /api/files/upload
// ─────────────────────────────────────────
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { fileName, fileSize, encryptedData, s3Key: providedKey, salt, iv, textContent } = req.body;

    // ── DUPLICATE CHECK ──
    const existingFiles = await File.find({ user: req.user.id });
    const dupResult = checkDuplicate({ fileName, fileSize }, existingFiles);
    if (dupResult.isDuplicate) {
      return res.status(409).json({
        isDuplicate: true,
        message: dupResult.message,
        existingFileId: dupResult.existingFileId,
      });
    }

    // Prefer metadata-only upload: client may upload directly to S3 first and provide s3Key.
    const s3Key = providedKey || `${req.user.id}/${Date.now()}_${fileName}`;

    if (encryptedData) {
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        Body: encryptedData,
        ContentType: "application/octet-stream",
      }));
      console.log("✅ Encrypted file uploaded to S3:", s3Key);
    }

    if (!providedKey && !encryptedData) {
      return res.status(400).json({ message: "Either encryptedData or s3Key must be provided" });
    }

    const text = textContent || fileName;
    const summary = await generateSummary(text);
    const { securityLevel, securityReason } = analyzeSecurity(text);
    const tags = generateTags(text, fileName);
    const suggestedName = autoRename(fileName, text);

    const newFile = new File({
      user: req.user.id,
      fileName,
      fileSize,
      s3Key,
      salt: salt || "",
      iv: iv || "",
      encryption: {
        enabled: !!(salt || iv),
        algorithm: "AES-256-GCM",
        metadataOnly: true,
      },
      summary,
      securityLevel,
      securityReason,
      tags,
    });

    await newFile.save();

    res.json({ file: newFile, suggestedName });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// ─────────────────────────────────────────
// POST /api/files/presign/upload
// Returns a presigned PUT URL for direct client upload to S3
// ─────────────────────────────────────────
router.post("/presign/upload", authMiddleware, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ message: "fileName required" });

    const s3Key = `${req.user.id}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes

    res.json({ uploadUrl, s3Key });
  } catch (err) {
    console.error("PRESIGN UPLOAD ERROR:", err);
    res.status(500).json({ message: "Presign failed" });
  }
});

// ─────────────────────────────────────────
// GET /api/files/:id/presign-download
// Returns a presigned GET URL to download a file from S3
// ─────────────────────────────────────────
router.get("/:id/presign-download", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.user.toString() !== req.user.id) return res.status(403).json({ message: "Access denied" });

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes

    res.json({ downloadUrl });
  } catch (err) {
    console.error("PRESIGN DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Presign download failed" });
  }
});

// ─────────────────────────────────────────
// GET /api/files
// ─────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// ─────────────────────────────────────────
// GET /api/files/analytics/summary
// ─────────────────────────────────────────
router.get("/analytics/summary", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id });
    const totalFiles   = files.length;
    const totalStorage = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    res.json({ totalFiles, totalStorage });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// ─────────────────────────────────────────
// GET /api/files/:id/download
// ─────────────────────────────────────────
router.get("/:id/download", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    res.json({
      fileName: file.fileName,
      downloadUrl,
      salt: file.salt,
      iv: file.iv,
      encryption: {
        metadataOnly: true,
        algorithm: "AES-256-GCM",
      },
    });

  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────
// DELETE /api/files/:id
// ─────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    await file.deleteOne();
    res.json({ message: "File deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// ─────────────────────────────────────────
// GET /api/files/search?q=keyword
// ─────────────────────────────────────────
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase();
    if (!query) return res.status(400).json({ message: "Query required" });

    const files = await File.find({ user: req.user.id });

    const results = files.filter((f) =>
      f.fileName?.toLowerCase().includes(query) ||
      f.summary?.toLowerCase().includes(query) ||
      f.securityReason?.toLowerCase().includes(query) ||
      f.tags?.some((tag) => tag.toLowerCase().includes(query))
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
});

// ─────────────────────────────────────────
// POST /api/files/presign/complete
// Called after client uploads directly to S3 to create DB record and run AI analysis
// Body: { s3Key, fileName, fileSize, salt?, iv?, textContent? }
// ─────────────────────────────────────────
router.post("/presign/complete", authMiddleware, async (req, res) => {
  try {
    const { s3Key, fileName, fileSize, salt, iv, textContent } = req.body;
    if (!s3Key || !fileName) return res.status(400).json({ message: "s3Key and fileName required" });

    // duplicate check
    const existingFiles = await File.find({ user: req.user.id });
    const dupResult = checkDuplicate({ fileName, fileSize }, existingFiles);
    if (dupResult.isDuplicate) {
      return res.status(409).json({ isDuplicate: true, message: dupResult.message, existingFileId: dupResult.existingFileId });
    }

    const text = textContent || fileName;
    const summary = await generateSummary(text);
    const { securityLevel, securityReason } = analyzeSecurity(text);
    const tags = generateTags(text, fileName);
    const suggestedName = autoRename(fileName, text);

    const newFile = new File({
      user: req.user.id,
      fileName,
      fileSize,
      s3Key,
      salt: salt || "",
      iv: iv || "",
      encryption: {
        enabled: !!(salt || iv),
        algorithm: "AES-256-GCM",
        metadataOnly: true,
      },
      summary,
      securityLevel,
      securityReason,
      tags,
    });

    await newFile.save();

    res.json({ file: newFile, suggestedName });
  } catch (err) {
    console.error("PRESIGN COMPLETE ERROR:", err);
    res.status(500).json({ message: "Failed to complete upload" });
  }
});

module.exports = router;

