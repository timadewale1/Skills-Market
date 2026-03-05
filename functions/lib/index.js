"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileWalletBalances = exports.hourlyDefendCheckin = exports.hourlyDisputeCheckin = exports.hourlyAttachCheckinScreenshot = exports.hourlyCreateCheckin = exports.hourlyResumeWork = exports.hourlyPauseWork = exports.hourlyStartWork = exports.releasePayout = exports.autoApprovePayouts = exports.watermarkFinalWorkUpload = exports.watermarkHourlyCheckinUpload = exports.watermarkMilestoneUpload = void 0;
const admin = __importStar(require("firebase-admin"));
const storage_1 = require("firebase-functions/v2/storage");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const storage_2 = require("firebase-admin/storage");
const sharp_1 = __importDefault(require("sharp"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const pdf_lib_1 = require("pdf-lib");
const axios_1 = __importDefault(require("axios"));
admin.initializeApp();
const db = admin.firestore();
// ------------------------------
// Helpers
// ------------------------------
function requireAuth(request) {
    if (!request.auth?.uid)
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    return request.auth.uid;
}
async function getWorkspace(wsId) {
    const snap = await db.doc(`workspaces/${wsId}`).get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Workspace not found.");
    return snap.data();
}
function ensureParticipant(uid, ws) {
    if (uid !== ws.clientUid && uid !== ws.talentUid)
        throw new https_1.HttpsError("permission-denied", "Not a participant.");
}
function ensureTalent(uid, ws) {
    if (uid !== ws.talentUid)
        throw new https_1.HttpsError("permission-denied", "Talent only.");
}
function ensureClient(uid, ws) {
    if (uid !== ws.clientUid)
        throw new https_1.HttpsError("permission-denied", "Client only.");
}
function msFromTs(v) {
    if (!v)
        return 0;
    if (typeof v.toMillis === "function")
        return v.toMillis();
    return 0;
}
// Helper: Detect file type from extension
function getFileType(filename) {
    const ext = filename.toLowerCase().split(".").pop() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext))
        return "image";
    if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext))
        return "video";
    if (ext === "pdf")
        return "pdf";
    if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext))
        return "document";
    return "file";
}
async function watermarkToPreviewJpeg(tmpIn, tmpOut) {
    const base = (0, sharp_1.default)(tmpIn).rotate().resize({ width: 1600, withoutEnlargement: true });
    const meta = await base.metadata();
    const width = meta.width || 1600;
    const height = meta.height || 900;
    const watermarkSvg = Buffer.from(`
    <svg width="${width}" height="${height}">
      <defs>
        <pattern id="p" patternUnits="userSpaceOnUse" width="520" height="300" patternTransform="rotate(-20)">
          <text x="0" y="150" font-size="48"
            fill="rgba(255,255,255,0.22)"
            font-family="Arial" font-weight="700">
            SKILLS MARKET • PREVIEW
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#p)"/>
    </svg>
  `);
    await base
        .jpeg({ quality: 78 })
        .composite([{ input: watermarkSvg, top: 0, left: 0 }])
        .toFile(tmpOut);
}
// Helper: Process file based on type (watermark images, generate previews for videos/pdfs)
async function processFileToPreview(tmpIn, tmpOut, filename, contentType) {
    const fileType = getFileType(filename);
    // Validate file first
    const validation = await validateFileBeforeStorage(tmpIn, filename, contentType);
    if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.error}`);
    }
    if (fileType === "image") {
        // For images: Apply watermark
        await watermarkToPreviewJpeg(tmpIn, tmpOut);
        return "image/jpeg"; // Always output as JPEG
    }
    else if (fileType === "video") {
        // For videos: Extract thumbnail
        try {
            await extractVideoThumbnail(tmpIn, tmpOut);
            return "image/jpeg"; // Output thumbnail as JPEG
        }
        catch (err) {
            console.warn("[processFileToPreview] Video thumbnail failed, creating fallback");
            // Fallback: Create simple text preview
            const canvas = require("canvas");
            const c = canvas.createCanvas(800, 450);
            const ctx = c.getContext("2d");
            ctx.fillStyle = "#f3f4f6";
            ctx.fillRect(0, 0, 800, 450);
            ctx.fillStyle = "#666";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Video Preview - Click to Play", 400, 225);
            const buffer = c.toBuffer("image/jpeg");
            await fs.writeFile(tmpOut, buffer);
            return "image/jpeg";
        }
    }
    else if (fileType === "pdf") {
        // For PDFs: Generate preview image with watermark
        try {
            await generatePdfPreview(tmpIn, tmpOut);
            return "image/jpeg"; // Output preview as JPEG
        }
        catch (err) {
            console.warn("[processFileToPreview] PDF preview failed, creating fallback");
            // Fallback: Create simple text preview
            const canvas = require("canvas");
            const c = canvas.createCanvas(800, 450);
            const ctx = c.getContext("2d");
            ctx.fillStyle = "#f3f4f6";
            ctx.fillRect(0, 0, 800, 450);
            ctx.fillStyle = "#666";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("PDF Preview Available", 400, 225);
            const buffer = c.toBuffer("image/jpeg");
            await fs.writeFile(tmpOut, buffer);
            return "image/jpeg";
        }
    }
    else {
        // For documents/other files: Copy as-is with metadata
        // The frontend will display as "download only" with appropriate badge
        await fs.copyFile(tmpIn, tmpOut);
        return contentType; // Preserve original content type
    }
}
// Helper: Extract thumbnail from video using FFmpeg
// Note: Video thumbnail generation requires FFmpeg which is not available in standard Cloud Functions
// For production, consider:
// 1. Using Google Cloud Video Intelligence API
// 2. Using a separate Video Processing service (e.g., Mux, Cloudinary)
// 3. Running FFmpeg in Cloud Run instead of Cloud Functions
// For now, videos are stored as-is and displayed as preview cards
async function extractVideoThumbnail(tmpIn, tmpOut) {
    console.log("[extractVideoThumbnail] Skipping - requires FFmpeg on Cloud Run");
    // Create simple placeholder JPEG (1x1 blue pixel)
    const placeholder = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
        0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
        0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
        0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
        0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
        0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
        0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
        0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
        0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
        0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
        0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xFF, 0xD9,
    ]);
    await fs.writeFile(tmpOut, placeholder);
}
// Helper: Generate preview image from PDF (first page with watermark)
async function generatePdfPreview(tmpIn, tmpOut) {
    console.log("[generatePdfPreview] Processing PDF - adding watermark metadata");
    try {
        const pdfBytes = await fs.readFile(tmpIn);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
        // Add watermark text to first page using pdf-lib
        if (pdfDoc.getPageCount() > 0) {
            const firstPage = pdfDoc.getPage(0);
            const { width, height } = firstPage.getSize();
            firstPage.drawText("SKILLS MARKET • PREVIEW", {
                x: 50,
                y: height - 50,
                size: 30,
                color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.9),
                opacity: 0.22,
            });
        }
        // Store the watermarked PDF (client will display native PDF viewer)
        const modifiedPdfBytes = await pdfDoc.save();
        await fs.writeFile(tmpOut, modifiedPdfBytes);
        console.log("[generatePdfPreview] PDF watermarked and stored");
    }
    catch (err) {
        console.warn("[generatePdfPreview] Error processing PDF:", err);
        // Fallback: just copy the original file
        const pdfBytes = await fs.readFile(tmpIn);
        await fs.writeFile(tmpOut, pdfBytes);
        console.log("[generatePdfPreview] PDF copied without modifications");
    }
}
// Helper: Scan file for viruses (using VirusTotal or ClamAV)
async function scanFileForVirus(tmpIn, fileType) {
    try {
        // Skip virus scanning for non-executable files (optional security level)
        const dangerousTypes = ["exe", "app", "bat", "cmd", "com", "scr"];
        const ext = tmpIn.toLowerCase().split(".").pop() || "";
        if (dangerousTypes.includes(ext)) {
            console.warn("[scanFileForVirus] Potentially dangerous file type blocked:", ext);
            return { clean: false, reason: "Executable files not allowed" };
        }
        // If CLAMD_HOST env var is set, use ClamAV
        const clamHost = process.env.CLAMD_HOST;
        if (clamHost) {
            try {
                const fileStream = await fs.readFile(tmpIn);
                const response = await axios_1.default.post(`http://${clamHost}:3310/scan`, fileStream, {
                    headers: { "Content-Type": "application/octet-stream" },
                    timeout: 10000,
                });
                const isClean = response.status === 200 && response.data?.clean !== false;
                return { clean: isClean, reason: response.data?.reason };
            }
            catch (err) {
                console.warn("[scanFileForVirus] ClamAV error, allowing file:", err);
                return { clean: true }; // Fail open if service unavailable
            }
        }
        // If no virus scanner configured, allow file
        return { clean: true };
    }
    catch (err) {
        console.warn("[scanFileForVirus] Unexpected error:", err);
        return { clean: true }; // Fail open on unexpected errors
    }
}
// Helper: Validate file before storage
async function validateFileBeforeStorage(tmpIn, filename, contentType) {
    try {
        const stats = await fs.stat(tmpIn);
        const fileSizeMB = stats.size / (1024 * 1024);
        // File size limits by type
        const fileType = getFileType(filename);
        const maxSizes = {
            image: 25,
            video: 500,
            pdf: 100,
            document: 50,
            file: 100,
        };
        const maxSize = maxSizes[fileType] || 100;
        if (fileSizeMB > maxSize) {
            return { valid: false, error: `File exceeds ${maxSize}MB limit (${fileSizeMB.toFixed(1)}MB)` };
        }
        // Check for virus
        const virusScan = await scanFileForVirus(tmpIn, fileType);
        if (!virusScan.clean) {
            return { valid: false, error: `File blocked: ${virusScan.reason || "Potential threat detected"}` };
        }
        return { valid: true };
    }
    catch (err) {
        console.error("[validateFileBeforeStorage] Error:", err);
        return { valid: false, error: "File validation failed" };
    }
}
// ------------------------------
// Storage Trigger: Milestone RAW -> PREVIEW
// Input:  workspaces/{wsId}/milestones/{milestoneId}/raw/{file}
// Output: workspaces/{wsId}/milestones/{milestoneId}/previews/{...}
// Writes preview attachment into:
// Firestore: workspaces/{wsId}/milestones/{milestoneId}
// Supports: Images (watermarked to JPEG), Videos, PDFs, Documents (copied as-is)
// ------------------------------
exports.watermarkMilestoneUpload = (0, storage_1.onObjectFinalized)(async (event) => {
    try {
        const filePath = event.data.name || "";
        const contentType = event.data.contentType || "";
        if (!filePath.startsWith("workspaces/"))
            return;
        const parts = filePath.split("/");
        if (parts.length < 6)
            return;
        if (parts[0] !== "workspaces" || parts[2] !== "milestones" || parts[4] !== "raw")
            return;
        const wsId = parts[1];
        const milestoneId = parts[3];
        const rawFilename = parts.slice(5).join("/"); // Get the filename
        console.log("[watermarkMilestoneUpload] start", { filePath, contentType, wsId, milestoneId, rawFilename });
        const bucket = (0, storage_2.getStorage)().bucket(event.data.bucket);
        const tmpDir = os.tmpdir();
        const tmpIn = path.join(tmpDir, `raw_${Date.now()}.tmp`);
        const fileType = getFileType(rawFilename);
        // Images, videos, and PDFs generate JPEG previews; others keep original extension
        const tmpOutExt = ["image", "video", "pdf"].includes(fileType) ? ".jpg" : path.extname(rawFilename);
        const tmpOut = path.join(tmpDir, `preview_${Date.now()}${tmpOutExt}`);
        await bucket.file(filePath).download({ destination: tmpIn });
        // Process file based on type
        const previewContentType = await processFileToPreview(tmpIn, tmpOut, rawFilename, contentType);
        // Determine preview filename - images, videos, PDFs become JPEGs
        const previewFilename = ["image", "video", "pdf"].includes(fileType) ? `${Date.now()}_preview.jpg` : `${Date.now()}_preview${path.extname(rawFilename)}`;
        const previewPath = `workspaces/${wsId}/milestones/${milestoneId}/previews/${previewFilename}`;
        await bucket.upload(tmpOut, {
            destination: previewPath,
            contentType: previewContentType,
            metadata: {
                cacheControl: "private, max-age=3600",
                fileType: fileType, // Store file type as metadata
                original: rawFilename,
            },
        });
        // ✅ SAFE size lookup
        let size = 0;
        try {
            const [meta] = await bucket.file(previewPath).getMetadata();
            size = Number(meta.size || 0);
        }
        catch (e) {
            console.warn("[watermarkMilestoneUpload] size lookup failed, continuing", e);
        }
        console.log("[watermarkMilestoneUpload] writing firestore attachment", { previewPath, size, fileType });
        // Store preview attachment with file type info
        const previewName = ["image", "video", "pdf"].includes(fileType) ? "preview.jpg" : `preview${path.extname(rawFilename)}`;
        await db.doc(`workspaces/${wsId}/milestones/${milestoneId}`).set({
            attachments: admin.firestore.FieldValue.arrayUnion({
                kind: "preview",
                name: previewName,
                contentType: previewContentType,
                size,
                storagePath: previewPath,
                fileType: fileType, // Add file type for frontend
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await fs.unlink(tmpIn).catch(() => { });
        await fs.unlink(tmpOut).catch(() => { });
        console.log("[watermarkMilestoneUpload] done", { wsId, milestoneId, fileType });
    }
    catch (err) {
        console.error("[watermarkMilestoneUpload] FAILED", err);
    }
});
// ------------------------------
// Storage Trigger: Hourly RAW -> PREVIEW
// Input:  workspaces/{wsId}/hourly/checkins/{checkinId}/raw/{file}
// Output: workspaces/{wsId}/hourly/checkins/{checkinId}/previews/{...}.jpg
// Writes preview url into:
// Firestore: workspaces/{wsId}/hourly/session/checkins/{checkinId}
// ------------------------------
exports.watermarkHourlyCheckinUpload = (0, storage_1.onObjectFinalized)(async (event) => {
    const filePath = event.data.name || "";
    const contentType = event.data.contentType || "";
    if (!filePath.startsWith("workspaces/"))
        return;
    if (!contentType.startsWith("image/"))
        return;
    const parts = filePath.split("/");
    if (parts.length < 7)
        return;
    if (parts[0] !== "workspaces" || parts[2] !== "hourly" || parts[3] !== "checkins" || parts[5] !== "raw")
        return;
    const wsId = parts[1];
    const checkinId = parts[4];
    const bucket = (0, storage_2.getStorage)().bucket(event.data.bucket);
    const tmpDir = os.tmpdir();
    const tmpIn = path.join(tmpDir, `raw_hour_${Date.now()}.img`);
    const tmpOut = path.join(tmpDir, `preview_hour_${Date.now()}.jpg`);
    await bucket.file(filePath).download({ destination: tmpIn });
    await watermarkToPreviewJpeg(tmpIn, tmpOut);
    const previewPath = `workspaces/${wsId}/hourly/checkins/${checkinId}/previews/${Date.now()}_preview.jpg`;
    await bucket.upload(tmpOut, {
        destination: previewPath,
        contentType: "image/jpeg",
        metadata: { cacheControl: "private, max-age=3600" },
    });
    await db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`).set({
        screenshotPreviewPath: previewPath,
        screenshotPreviewContentType: "image/jpeg",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await fs.unlink(tmpIn).catch(() => { });
    await fs.unlink(tmpOut).catch(() => { });
});
// ------------------------------
// Storage Trigger: Final Work RAW -> PREVIEW
// Input:  workspaces/{wsId}/finalWork/raw/{file}
// Output: workspaces/{wsId}/finalWork/previews/{...}
// Writes preview attachment into:
// Firestore: workspaces/{wsId}/finalWork/submission
// Supports: Images (watermarked to JPEG), Videos, PDFs, Documents (copied as-is)
// ------------------------------
exports.watermarkFinalWorkUpload = (0, storage_1.onObjectFinalized)(async (event) => {
    try {
        const filePath = event.data.name || "";
        const contentType = event.data.contentType || "";
        if (!filePath.startsWith("workspaces/"))
            return;
        const parts = filePath.split("/");
        if (parts.length < 5)
            return;
        if (parts[0] !== "workspaces" || parts[2] !== "finalWork" || parts[3] !== "raw")
            return;
        const wsId = parts[1];
        const rawFilename = parts.slice(4).join("/"); // Get the filename
        console.log("[watermarkFinalWorkUpload] start", { filePath, contentType, wsId, rawFilename });
        const bucket = (0, storage_2.getStorage)().bucket(event.data.bucket);
        const tmpDir = os.tmpdir();
        const tmpIn = path.join(tmpDir, `raw_fw_${Date.now()}.tmp`);
        const fileType = getFileType(rawFilename);
        // Images, videos, and PDFs generate JPEG previews; others keep original extension
        const tmpOutExt = ["image", "video", "pdf"].includes(fileType) ? ".jpg" : path.extname(rawFilename);
        const tmpOut = path.join(tmpDir, `preview_fw_${Date.now()}${tmpOutExt}`);
        await bucket.file(filePath).download({ destination: tmpIn });
        // Process file based on type
        const previewContentType = await processFileToPreview(tmpIn, tmpOut, rawFilename, contentType);
        // Determine preview filename - images, videos, PDFs become JPEGs
        const previewFilename = ["image", "video", "pdf"].includes(fileType) ? `${Date.now()}_preview.jpg` : `${Date.now()}_preview${path.extname(rawFilename)}`;
        const previewPath = `workspaces/${wsId}/finalWork/previews/${previewFilename}`;
        await bucket.upload(tmpOut, {
            destination: previewPath,
            contentType: previewContentType,
            metadata: {
                cacheControl: "private, max-age=3600",
                fileType: fileType, // Store file type as metadata
                original: rawFilename,
            },
        });
        // ✅ SAFE size lookup
        let size = 0;
        try {
            const [meta] = await bucket.file(previewPath).getMetadata();
            size = Number(meta.size || 0);
        }
        catch (e) {
            console.warn("[watermarkFinalWorkUpload] size lookup failed, continuing", e);
        }
        console.log("[watermarkFinalWorkUpload] writing firestore attachment", { previewPath, size, fileType });
        // Store preview attachment with file type info
        // Store preview attachment with file type info
        const previewName = ["image", "video", "pdf"].includes(fileType) ? "preview.jpg" : `preview${path.extname(rawFilename)}`;
        await db.doc(`workspaces/${wsId}/finalWork/submission`).set({
            attachments: admin.firestore.FieldValue.arrayUnion({
                kind: "preview",
                name: previewName,
                contentType: previewContentType,
                size,
                storagePath: previewPath,
                fileType: fileType, // Add file type for frontend
            }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await fs.unlink(tmpIn).catch(() => { });
        await fs.unlink(tmpOut).catch(() => { });
        console.log("[watermarkFinalWorkUpload] done", { wsId, fileType });
    }
    catch (err) {
        console.error("[watermarkFinalWorkUpload] FAILED", err);
    }
});
// Helper: process a payout request by releasing escrow to talent (credits wallet, records transactions, credits platform revenue, writes escrow ledger)
async function processPayout(wsId, payoutId, actorUid = "system") {
    const payoutRef = db.doc(`workspaces/${wsId}/payoutRequests/${payoutId}`);
    return db.runTransaction(async (tx) => {
        const prSnap = await tx.get(payoutRef);
        if (!prSnap.exists)
            return;
        const pr = prSnap.data();
        if (pr.status === "paid")
            return;
        const wsRef = db.doc(`workspaces/${wsId}`);
        const wsSnap = await tx.get(wsRef);
        if (!wsSnap.exists)
            throw new Error("Workspace missing");
        const ws = wsSnap.data();
        const gross = Number(ws?.payment?.amount || 0);
        if (!gross || gross <= 0)
            throw new Error("Invalid escrow amount");
        const fee = Number((gross * 0.1).toFixed(2));
        const net = Number((gross - fee).toFixed(2));
        const talentUid = ws.talentUid;
        if (!talentUid)
            throw new Error("Talent UID missing");
        const walletRef = db.doc(`wallets/${talentUid}`);
        const wSnap = await tx.get(walletRef);
        const existing = wSnap?.exists ? wSnap.data() : {};
        const newAvailable = Number((Number(existing.availableBalance || 0) + net).toFixed(2));
        const newTotalEarned = Number((Number(existing.totalEarned || 0) + net).toFixed(2));
        tx.set(walletRef, {
            uid: talentUid,
            role: "talent",
            availableBalance: newAvailable,
            totalEarned: newTotalEarned,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        tx.set(walletRef.collection("transactions").doc(payoutId), {
            type: "credit",
            reason: "payout_release",
            amount: net,
            currency: "NGN",
            status: "completed",
            meta: { wsId, payoutId },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Record platform revenue (simple document for audit)
        const platformRef = db.doc(`platform/revenue/${payoutId}`);
        tx.set(platformRef, {
            amount: fee,
            currency: "NGN",
            meta: { wsId, payoutId },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Write escrow ledger entry for release
        const escrowLedgerRef = db.collection(`workspaces/${wsId}/escrowLedger`).doc();
        tx.set(escrowLedgerRef, {
            type: "release",
            payoutId,
            amount: gross,
            netCredited: net,
            platformFee: fee,
            talentUid,
            releasedBy: actorUid,
            currency: "NGN",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Mark payout as paid and update workspace escrow flag
        tx.update(payoutRef, {
            status: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            paidBy: actorUid,
            netAmount: net,
            platformFee: fee,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        tx.update(wsRef, {
            "payment.escrow": false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
}
// ------------------------------
// Scheduled: auto-approve payoutRequests after 24h (every 5 mins)
// Path: workspaces/{wsId}/payoutRequests/{id}
// Uses finalWorkId (not milestoneId) for schema harmonization
// ------------------------------
exports.autoApprovePayouts = (0, scheduler_1.onSchedule)("every 5 minutes", async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db
        .collectionGroup("payoutRequests")
        .where("status", "==", "requested")
        .where("autoApproveAt", "<=", now)
        .limit(200)
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    for (const d of snap.docs) {
        const pr = d.data();
        const wsRef = d.ref.parent.parent;
        if (!wsRef)
            continue;
        const wsId = wsRef.id;
        const finalWorkId = pr.finalWorkId || "submission";
        // Update finalWork/submission document (not milestones)
        const finalWorkRef = db.doc(`workspaces/${wsId}/finalWork/${finalWorkId}`);
        batch.update(d.ref, {
            status: "approved",
            decision: {
                decision: "approved",
                reason: "Auto-approved after 24 hours with no client review.",
                at: admin.firestore.FieldValue.serverTimestamp(),
                byUid: "system",
                mode: "auto",
            },
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batch.set(finalWorkRef, {
            status: "approved",
            review: {
                decision: "approved",
                reason: "Auto-approved after 24 hours with no client review.",
                at: admin.firestore.FieldValue.serverTimestamp(),
                byUid: "system",
                mode: "auto",
            },
            approvedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        batch.update(wsRef, { updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();
    // After approving, release funds for each auto-approved payout
    for (const d of snap.docs) {
        try {
            const wsRef = d.ref.parent.parent;
            if (!wsRef)
                continue;
            const wsId = wsRef.id;
            await processPayout(wsId, d.id, "system");
        }
        catch (err) {
            console.error("[autoApprovePayouts] processPayout failed for doc", d.id, err);
        }
    }
});
exports.releasePayout = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const payoutId = String(request.data?.payoutId || "");
    if (!wsId || !payoutId)
        throw new https_1.HttpsError("invalid-argument", "wsId and payoutId required");
    const wsSnap = await db.doc(`workspaces/${wsId}`).get();
    if (!wsSnap.exists)
        throw new https_1.HttpsError("not-found", "Workspace not found");
    const ws = wsSnap.data();
    if (uid !== ws.clientUid)
        throw new https_1.HttpsError("permission-denied", "Client only");
    try {
        await processPayout(wsId, payoutId, uid);
        return { ok: true };
    }
    catch (e) {
        console.error("[releasePayout] failed", e);
        throw new https_1.HttpsError("internal", "Failed to release payout");
    }
});
// ------------------------------
// Callable: Hourly controls
// ------------------------------
exports.hourlyStartWork = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const payStatus = ws.payment?.status || "unfunded";
    if (payStatus !== "initiated" && payStatus !== "funded") {
        throw new https_1.HttpsError("failed-precondition", "Client must pay before work starts.");
    }
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const snap = await sessionRef.get();
    if (snap.exists) {
        const s = snap.data();
        if (s.status !== "not_started")
            throw new https_1.HttpsError("failed-precondition", "Session already started.");
    }
    await sessionRef.set({
        status: "running",
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastResumedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalSeconds: 0,
        currentHourIndex: 1,
        currentHourStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
exports.hourlyPauseWork = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const snap = await sessionRef.get();
    if (!snap.exists)
        throw new https_1.HttpsError("failed-precondition", "Session not started.");
    const s = snap.data();
    if (s.status !== "running")
        throw new https_1.HttpsError("failed-precondition", "Session not running.");
    const last = s.lastResumedAt;
    const elapsed = Math.max(0, (Date.now() - msFromTs(last)) / 1000);
    await sessionRef.update({
        status: "paused",
        totalSeconds: Number(s.totalSeconds || 0) + elapsed,
        pausedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.hourlyResumeWork = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const snap = await sessionRef.get();
    if (!snap.exists)
        throw new https_1.HttpsError("failed-precondition", "Session not started.");
    const s = snap.data();
    if (s.status !== "paused")
        throw new https_1.HttpsError("failed-precondition", "Session not paused.");
    await sessionRef.update({
        status: "running",
        lastResumedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.hourlyCreateCheckin = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const note = String(request.data?.note || "").trim();
    if (!wsId)
        throw new https_1.HttpsError("invalid-argument", "wsId required");
    if (note.length < 6)
        throw new https_1.HttpsError("invalid-argument", "Note too short.");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    const sessionRef = db.doc(`workspaces/${wsId}/hourly/session`);
    const sSnap = await sessionRef.get();
    if (!sSnap.exists)
        throw new https_1.HttpsError("failed-precondition", "Session not started.");
    const s = sSnap.data();
    if (s.status !== "running")
        throw new https_1.HttpsError("failed-precondition", "Session must be running.");
    const hourIndex = Number(s.currentHourIndex || 1);
    const hourStartedAt = s.currentHourStartedAt;
    const mins = (Date.now() - msFromTs(hourStartedAt)) / 60000;
    if (mins < 55) {
        throw new https_1.HttpsError("failed-precondition", `Too early. Check in after ~1 hour. (${Math.floor(mins)} mins elapsed)`);
    }
    const checkinRef = db.collection(`workspaces/${wsId}/hourly/session/checkins`).doc();
    await checkinRef.set({
        hourIndex,
        note,
        status: "submitted",
        byUid: uid,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await sessionRef.update({
        currentHourIndex: hourIndex + 1,
        currentHourStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true, checkinId: checkinRef.id };
});
exports.hourlyAttachCheckinScreenshot = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const checkinId = String(request.data?.checkinId || "");
    const rawStoragePath = String(request.data?.rawStoragePath || "");
    const contentType = String(request.data?.contentType || "");
    if (!wsId || !checkinId || !rawStoragePath) {
        throw new https_1.HttpsError("invalid-argument", "wsId, checkinId, rawStoragePath required.");
    }
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    await db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`).set({
        screenshotRawPath: rawStoragePath,
        screenshotRawContentType: contentType,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { ok: true };
});
exports.hourlyDisputeCheckin = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const checkinId = String(request.data?.checkinId || "");
    const reason = String(request.data?.reason || "").trim();
    if (!wsId || !checkinId)
        throw new https_1.HttpsError("invalid-argument", "wsId and checkinId required.");
    if (reason.length < 15)
        throw new https_1.HttpsError("invalid-argument", "Reason too short.");
    const ws = await getWorkspace(wsId);
    ensureClient(uid, ws);
    // ✅ correct location
    const ref = db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Checkin not found.");
    await ref.update({
        status: "disputed",
        dispute: {
            reason,
            at: admin.firestore.FieldValue.serverTimestamp(),
            byUid: uid,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
exports.hourlyDefendCheckin = (0, https_1.onCall)(async (request) => {
    const uid = requireAuth(request);
    const wsId = String(request.data?.wsId || "");
    const checkinId = String(request.data?.checkinId || "");
    const note = String(request.data?.note || "").trim();
    if (!wsId || !checkinId)
        throw new https_1.HttpsError("invalid-argument", "wsId and checkinId required.");
    if (note.length < 12)
        throw new https_1.HttpsError("invalid-argument", "Defense note too short.");
    const ws = await getWorkspace(wsId);
    ensureTalent(uid, ws);
    // ✅ correct location
    const ref = db.doc(`workspaces/${wsId}/hourly/session/checkins/${checkinId}`);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Checkin not found.");
    const c = snap.data();
    if (c.status !== "disputed")
        throw new https_1.HttpsError("failed-precondition", "Only disputed checkins can be defended.");
    await ref.update({
        defense: {
            note,
            at: admin.firestore.FieldValue.serverTimestamp(),
            byUid: uid,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { ok: true };
});
// Scheduled: Reconcile wallet balances from transactions (daily)
// Detects and logs any discrepancies; optionally auto-fixes
// Runs daily at 2 AM UTC
// ------------------------------
exports.reconcileWalletBalances = (0, scheduler_1.onSchedule)("every day 02:00", async () => {
    console.log("[reconcileWalletBalances] Starting daily reconciliation...");
    const issues = [];
    let fixCount = 0;
    const walletsSnap = await db.collection("wallets").get();
    for (const walletDoc of walletsSnap.docs) {
        const uid = walletDoc.id;
        const wallet = walletDoc.data();
        try {
            // Compute totals from all transactions
            const txSnap = await db.collection(`wallets/${uid}/transactions`).get();
            let computedAvailable = 0;
            let computedEarned = 0;
            let computedSpent = 0;
            for (const tx of txSnap.docs) {
                const t = tx.data();
                const amount = Number(t.amount || 0);
                const type = String(t.type || "");
                const reason = String(t.reason || "");
                if (type === "credit") {
                    if (reason === "payout_release" || reason === "withdrawal_reversal") {
                        computedAvailable += amount;
                        computedEarned += amount;
                    }
                    else if (reason === "deposit") {
                        computedAvailable += amount;
                    }
                }
                else if (type === "debit") {
                    if (reason === "workspace_funding") {
                        computedSpent += amount;
                    }
                    else if (reason === "withdrawal") {
                        computedAvailable = Math.max(0, computedAvailable - amount);
                    }
                }
            }
            // Compare with wallet aggregates
            const storedAvailable = Number(wallet.availableBalance || 0);
            const storedEarned = Number(wallet.totalEarned || 0);
            const storedSpent = Number(wallet.totalSpent || 0);
            const driftTol = 0.01; // Allow 1 kobo drift due to rounding
            const availDrift = Math.abs(storedAvailable - computedAvailable) > driftTol;
            const earnedDrift = Math.abs(storedEarned - computedEarned) > driftTol;
            const spentDrift = Math.abs(storedSpent - computedSpent) > driftTol;
            if (availDrift || earnedDrift || spentDrift) {
                const issue = {
                    uid,
                    role: wallet.role,
                    availDrift: { stored: storedAvailable, computed: computedAvailable },
                    earnedDrift: { stored: storedEarned, computed: computedEarned },
                    spentDrift: { stored: storedSpent, computed: computedSpent },
                };
                issues.push(issue);
                console.warn("[reconcileWalletBalances] DRIFT detected for", uid, issue);
                // Auto-fix by updating aggregates to match computed values
                await walletDoc.ref.update({
                    availableBalance: computedAvailable,
                    totalEarned: computedEarned,
                    totalSpent: computedSpent,
                    lastReconciled: admin.firestore.FieldValue.serverTimestamp(),
                });
                fixCount++;
                console.log("[reconcileWalletBalances] Fixed wallet", uid);
            }
        }
        catch (e) {
            console.error("[reconcileWalletBalances] Error for wallet", uid, e);
        }
    }
    // Log reconciliation summary
    console.log("[reconcileWalletBalances] Complete. Drifts found:", issues.length, "Fixed:", fixCount);
});
