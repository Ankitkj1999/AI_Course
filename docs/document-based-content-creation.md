# 📄 Document-Based Content Creation Guide

Learn how to create educational content from documents, web pages, and text using AiCourse's document-based content generation feature.

## Overview

The document-based content creation feature allows you to:
- Upload PDF, DOCX, or TXT files to generate courses, quizzes, flashcards, and guides
- Extract content from web URLs (articles, documentation, blog posts)
- Paste text directly for immediate content generation
- Automatically extract and clean text from various sources

## Getting Started

### Accessing the Feature

Navigate to any content creation page:
1. **Generate Course** - `/dashboard/generate-course`
2. **Create Quiz** - `/dashboard/create-quiz`
3. **Create Flashcards** - `/dashboard/create-flashcard`
4. **Create Guide** - `/dashboard/create-guide`

Each page includes document upload options alongside traditional keyword-based creation.

## Input Methods

### 1. File Upload

Upload documents from your computer to extract text content.

**Supported Formats:**
- PDF (`.pdf`) - Text-based PDFs only (no OCR for scanned documents)
- Microsoft Word (`.docx`) - Modern Word documents
- Plain Text (`.txt`) - Simple text files

**How to Upload:**
1. Click the **Upload File** tab
2. Drag and drop your file, or click "Select File" to browse
3. Wait for upload and extraction to complete
4. Review the extracted text preview
5. Click the content type button (Course, Quiz, Flashcard, or Guide)

**File Requirements:**
- Maximum file size: 10MB
- Only one file at a time
- File must be in a supported format

**Tips:**
- Use text-based PDFs for best results (not scanned images)
- DOCX files preserve paragraph structure and tables
- Remove unnecessary headers/footers before uploading for cleaner extraction

### 2. Web URL Extraction

Extract content directly from web pages.

**Supported URLs:**
- HTTP and HTTPS protocols only
- Articles, blog posts, documentation pages
- Any publicly accessible web content

**How to Extract from URL:**
1. Click the **From URL** tab
2. Paste the complete URL (including `https://`)
3. Click "Extract" or press Enter
4. Wait for content extraction (timeout after 10 seconds)
5. Review the cleaned text preview
6. Generate your desired content type

**Content Cleaning:**
The system automatically removes:
- Navigation menus
- Advertisements
- Footer content
- Cookie consent banners
- Social media share buttons

**Tips:**
- Use article URLs rather than homepage URLs
- Ensure the URL is publicly accessible (no login required)
- If extraction fails, try copying the text manually instead

### 3. Direct Text Input

Paste or type text directly for immediate processing.

**How to Use:**
1. Click the **Paste Text** tab
2. Paste or type your content in the text area
3. Monitor the character count (max 50,000 characters)
4. Generate content when ready

**Character Limits:**
- Maximum: 50,000 characters
- Warning at: 45,000 characters (90% of limit)
- Real-time character counter displayed

**Tips:**
- Clean up formatting before pasting (remove extra line breaks)
- For longer content, consider splitting into multiple pieces
- Use this method for quick content generation without file uploads

## Content Generation

### After Extraction

Once text is extracted (from file or URL), you'll see:
1. **Preview**: First 500 characters of extracted text
2. **Full Text Button**: View complete extracted content
3. **Generation Options**: Four buttons for different content types

### Generating Content

Click any of the four content type buttons:

**📚 Course**
- Creates structured learning path with modules and lessons
- Includes theory, examples, and progress tracking
- Best for: Comprehensive learning materials

**❓ Quiz**
- Generates multiple-choice questions with answers
- Tests understanding of the content
- Best for: Assessment and knowledge verification

**🧠 Flashcards**
- Creates question-answer pairs for study
- Ideal for memorization and quick review
- Best for: Key concepts and definitions

**✨ Guide**
- Builds comprehensive study materials
- Organized with sections and detailed explanations
- Best for: Reference materials and tutorials

### Customization Options

When generating content, you can:
- Set content title
- Choose AI provider (Gemini, OpenAI, etc.)
- Select AI model
- Set visibility (Public/Private)

## Processing Status

### Upload Progress

When uploading files, you'll see:
1. **Uploading**: Progress bar showing upload percentage
2. **Processing**: Extracting text from document
3. **Completed**: Text ready for content generation
4. **Failed**: Error message with details

### Status Polling

The system automatically checks processing status every 2 seconds until completion.

### Typical Processing Times

- **Text files**: < 1 second
- **DOCX files**: 1-3 seconds
- **PDF files**: 2-5 seconds
- **Web URLs**: 2-10 seconds (timeout at 10 seconds)

## Best Practices

### Document Preparation

**For PDFs:**
- Use text-based PDFs (not scanned images)
- Ensure text is selectable in the PDF
- Remove password protection before uploading
- Consider converting scanned PDFs to text first

**For DOCX:**
- Use standard formatting (avoid complex layouts)
- Tables are preserved but may need manual review
- Remove track changes and comments
- Save in modern .docx format (not .doc)

**For Text:**
- Use UTF-8 encoding
- Remove unnecessary formatting characters
- Keep line breaks for paragraph structure

### Content Quality

**For Better Results:**
- Use well-structured source material
- Ensure content is relevant to your topic
- Remove irrelevant sections before uploading
- Provide clear, focused content

**Avoid:**
- Mixed-language documents (stick to one language)
- Heavily formatted documents with complex layouts
- Documents with mostly images or diagrams
- Content with excessive special characters

### URL Selection

**Good URL Choices:**
- Educational articles
- Documentation pages
- Blog posts with substantial content
- Tutorial pages

**Avoid:**
- Paywalled content
- Login-required pages
- Video-heavy pages
- Image galleries

## Troubleshooting

### Upload Issues

**"Invalid file type" Error**
- Solution: Ensure file is PDF, DOCX, or TXT
- Check file extension matches actual format
- Try converting to a supported format

**"File size exceeds 10MB" Error**
- Solution: Compress or split the document
- Remove images if possible (for PDFs)
- Extract text and use direct text input instead

**"Upload failed" Error**
- Solution: Check internet connection
- Try a smaller file
- Refresh page and try again

### Extraction Issues

**"Failed to extract text from PDF"**
- Possible causes: Scanned PDF, corrupted file, password-protected
- Solution: Try converting to text first, or use OCR tool

**"URL is inaccessible"**
- Possible causes: Invalid URL, timeout, blocked access
- Solution: Verify URL is correct and publicly accessible
- Try copying content manually instead

**"Extraction failed"**
- Solution: Check file isn't corrupted
- Try different file format
- Use direct text input as alternative

### Generation Issues

**"Insufficient content for generation"**
- Solution: Provide more text (minimum ~200 words recommended)
- Combine multiple sources
- Add more context to the content

**"Text exceeds maximum length"**
- Solution: Split content into smaller sections
- Remove unnecessary parts
- Generate multiple pieces of content

## Data Privacy & Security

### File Storage

- Uploaded files are stored temporarily during processing
- Files are automatically deleted 5 minutes after extraction
- Files older than 1 hour are cleaned up automatically

### Data Retention

- Extracted text is stored for 1 hour
- Database records expire automatically (MongoDB TTL)
- No permanent storage of uploaded documents

### Access Control

- Only authenticated users can upload documents
- Users can only access their own processing records
- All uploads require valid authentication

## Tips for Success

1. **Start Small**: Test with a short document first
2. **Review Previews**: Always check extracted text before generating
3. **Choose Right Format**: Use the most appropriate input method
4. **Clean Content**: Remove unnecessary elements before uploading
5. **Be Patient**: Wait for processing to complete
6. **Try Alternatives**: If one method fails, try another input method

## Examples

### Example 1: Creating a Course from PDF

1. Navigate to "Generate Course"
2. Click "Upload File" tab
3. Upload your PDF textbook chapter
4. Wait for extraction (2-5 seconds)
5. Review the preview
6. Click "Course" button
7. Set title and options
8. Generate course

### Example 2: Quiz from Web Article

1. Navigate to "Create Quiz"
2. Click "From URL" tab
3. Paste article URL
4. Click "Extract"
5. Review cleaned content
6. Click "Quiz" button
7. Set quiz title
8. Generate quiz

### Example 3: Flashcards from Notes

1. Navigate to "Create Flashcards"
2. Click "Paste Text" tab
3. Paste your study notes
4. Verify character count
5. Click "Flashcards" button
6. Set title
7. Generate flashcards

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Verify your file meets requirements
3. Try an alternative input method
4. Contact support with error details

## Limitations

- No OCR for scanned PDFs
- 10MB file size limit
- 50,000 character text limit
- 10-second URL timeout
- One file upload at a time
- Text-based content only (no image analysis)
