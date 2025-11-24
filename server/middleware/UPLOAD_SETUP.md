# Document Upload Infrastructure Setup

## Overview
This document describes the document processing infrastructure setup for the document-context-generation feature.

## Installed Dependencies

The following npm packages have been installed in the server:

1. **langchain** (^1.0.6) - Core LangChain framework
2. **@langchain/community** (^1.0.4) - Community document loaders
3. **pdf-parse** (^1.1.1) - PDF text extraction
4. **mammoth** (^1.11.0) - DOCX document processing
5. **cheerio** (^1.1.2) - HTML parsing for web content
6. **multer** (^2.0.2) - Multipart file upload handling

## Multer Middleware Configuration

### File: `server/middleware/uploadMiddleware.js`

The middleware provides:

- **File upload handling** with disk storage
- **File type validation** (PDF, DOCX, TXT only)
- **File size limits** (10MB default, configurable)
- **Unique filename generation** with timestamps
- **Automatic directory creation**

### Exports:

```javascript
import { uploadSingle, uploadConfig } from './middleware/uploadMiddleware.js';

// uploadSingle - Middleware for single file upload (field name: 'document')
// uploadConfig - Configuration object with tempDir and maxFileSize
```

### Usage Example:

```javascript
import express from 'express';
import { uploadSingle } from './middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', uploadSingle, (req, res) => {
  // req.file contains the uploaded file information
  // req.file.path - temporary file path
  // req.file.filename - generated filename
  // req.file.originalname - original filename
  // req.file.size - file size in bytes
});
```

## Directory Structure

```
server/
├── uploads/
│   ├── .gitignore          # Prevents temporary files from being committed
│   └── temp/
│       └── .gitkeep        # Ensures directory is tracked by git
```

The `uploads/temp/` directory is automatically created if it doesn't exist.

## Environment Variables

Added to both `.env` and `.env.example`:

```bash
# Document Upload Configuration
UPLOAD_TEMP_DIR=./uploads/temp      # Temporary upload directory
MAX_FILE_SIZE=10485760              # Maximum file size in bytes (10MB)
CLEANUP_INTERVAL=300000             # Cleanup interval in ms (5 minutes)
URL_FETCH_TIMEOUT=10000             # URL fetch timeout in ms (10 seconds)
```

## File Type Validation

The middleware validates both MIME types and file extensions:

### Allowed MIME Types:
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `text/plain`

### Allowed Extensions:
- `.pdf`
- `.docx`
- `.txt`

## Error Handling

The middleware will reject uploads with appropriate errors for:

- **Invalid file type**: Returns error with message about allowed types
- **File too large**: Multer automatically rejects files exceeding MAX_FILE_SIZE
- **Multiple files**: Only single file uploads are allowed

## Security Features

1. **File type validation** - Both MIME type and extension checked
2. **Size limits** - Prevents DoS attacks via large files
3. **Unique filenames** - Prevents filename collisions
4. **Isolated storage** - Files stored in dedicated temp directory
5. **Single file limit** - Only one file per request

## Next Steps

The following components need to be implemented:

1. Document extraction service (using LangChain loaders)
2. Text splitting service (using RecursiveCharacterTextSplitter)
3. API endpoints for upload and extraction
4. Cleanup service for temporary files
5. Database schema for document processing records

## Testing

All dependencies have been verified to import correctly:
- ✓ @langchain/textsplitters
- ✓ @langchain/community
- ✓ pdf-parse
- ✓ mammoth
- ✓ cheerio
- ✓ multer

The upload middleware has been tested and confirmed working.
