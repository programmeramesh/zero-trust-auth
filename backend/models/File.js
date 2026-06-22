const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    fileName:       { type: String, required: true },
    fileSize:       { type: Number, required: true },
    s3Key:          { type: String, required: true },
    salt:           { type: String, default: "" },
    iv:             { type: String, default: "" },
    encryption: {
      enabled: { type: Boolean, default: false },
      algorithm: { type: String, default: "AES-256-GCM" },
      metadataOnly: { type: Boolean, default: true },
    },
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // AI Fields
    summary:        { type: String, default: "" },
    securityLevel:  { type: String, default: "Safe" },
    securityReason: { type: String, default: "" },
    tags:           { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
