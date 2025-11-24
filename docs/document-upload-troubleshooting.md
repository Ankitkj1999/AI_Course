# 🔧 Document Upload Troubleshooting Guide

Common issues and solutions for document-based content generation.

## Upload Issues

### File Upload Fails

**Symptom:** Upload button doesn't work or shows error immediately

**Possible Causes:**
1. File type not supported
2. File size exceeds limit
3. Network connection issue
4. Authentication expired

**Solutions:**

**Check File Type:**
```
Supported: PDF (.pdf), DOCX (.docx), TXT (.txt)
Not Supported: DOC, RTF, ODT, Pages, scanned PDFs
```
- Verify file extension matches actual format
- Convert unsupported formats to PDF or DOCX
- For scanned PDFs, use OCR tool first

**Check File Size:**
```
Maximum: 10MB
Current file size shown in upload dialog
```
- Compress PDF using online tools
- Remove images from document if possible
- Split large documents into smaller parts
- Use direct text input for very large content

**Check Network:**
- Verify internet connection
- Try uploading smaller test file
- Check browser console for errors (F12)
- Disable VPN if active

**Check Authentication:**
- Refresh the page
- Log out and log back in
- Clear browser cookies
- Check if session expired

### Upload Stalls at 100%

**Symptom:** Upload reaches 100% but processing never completes

**Possible Causes:**
1. Server processing timeout
2. Corrupted file
3. Server overload

**Solutions:**

**Wait Longer:**
- Large PDFs can take 30-60 seconds
- Check browser console for errors
- Don't refresh page during processing

**Try Different File:**
- Test with simple text file
- If test works, original file may be corrupted
- Try re-saving original document

**Check Server Status:**
- Look for server error messages
- Contact administrator if persistent
- Try during off-peak hours

### "Invalid File Type" Error

**Symptom:** Error message: "Invalid file type. Allowed types: PDF, DOCX, TXT"

**Solutions:**

**Verify File Extension:**
```bash
# Check actual file type (Mac/Linux)
file document.pdf

# Should show: PDF document, version X.X
```

**Common Issues:**
- `.doc` files (old Word format) - Save as `.docx`
- `.pages` files (Mac) - Export as PDF or DOCX
- `.odt` files (OpenOffice) - Export as DOCX
- Renamed files - Ensure actual format matches extension

**Fix:**
1. Open document in original application
2. Save As → Choose PDF or DOCX format
3. Upload the converted file

### "File Size Exceeds 10MB" Error

**Symptom:** Error message about file size limit

**Solutions:**

**Compress PDF:**
- Use online tools: SmallPDF, iLovePDF
- Adobe Acrobat: Save As → Reduced Size PDF
- Preview (Mac): Export → Reduce File Size

**Remove Images:**
- Copy text content only
- Paste into new document
- Save without images

**Split Document:**
- Divide into logical sections
- Upload and process separately
- Combine generated content later

**Alternative Method:**
- Copy text from document
- Use "Paste Text" tab instead
- Avoid file upload entirely

## Extraction Issues

### "Failed to Extract Text from PDF"

**Symptom:** Processing fails with PDF extraction error

**Possible Causes:**
1. Scanned PDF (image-based)
2. Password-protected PDF
3. Corrupted PDF file
4. Unsupported PDF version

**Solutions:**

**Check if Scanned:**
```
Test: Try to select text in PDF viewer
If you can't select text → Scanned PDF
```
- Use OCR tool (Adobe Acrobat, online OCR)
- Convert to text first
- Use "Paste Text" method instead

**Remove Password:**
- Open in PDF reader
- Print to PDF (removes protection)
- Or use password removal tool

**Repair Corrupted PDF:**
- Open and re-save in PDF reader
- Use PDF repair tool
- Try different PDF viewer

**Try Alternative:**
- Copy text manually
- Use "Paste Text" tab
- Convert to DOCX first

### "Failed to Extract Text from DOCX"

**Symptom:** DOCX processing fails

**Possible Causes:**
1. Corrupted DOCX file
2. Old DOC format (not DOCX)
3. Complex formatting
4. Embedded objects

**Solutions:**

**Verify Format:**
```
File extension: .docx (not .doc)
Created in: Word 2007 or later
```

**Simplify Document:**
- Remove complex tables
- Remove embedded objects
- Save as plain DOCX
- Remove track changes

**Convert Format:**
- Open in Word
- Save As → Word Document (.docx)
- Ensure modern format selected

**Alternative:**
- Copy text content
- Paste into new document
- Save as simple DOCX

### URL Extraction Fails

**Symptom:** "URL is inaccessible" or timeout error

**Possible Causes:**
1. Invalid URL format
2. Page requires login
3. Network timeout
4. Blocked by website

**Solutions:**

**Check URL Format:**
```
✓ Correct: https://example.com/article
✗ Wrong: example.com/article
✗ Wrong: www.example.com/article
```
- Must start with `http://` or `https://`
- Include full URL path
- No spaces or special characters

**Check Accessibility:**
- Open URL in browser
- Verify no login required
- Check if content loads
- Try incognito mode

**Timeout Issues:**
- Try again (may be temporary)
- Check internet connection
- Try different URL
- Use "Paste Text" instead

**Blocked Access:**
- Some sites block automated access
- Copy content manually
- Use "Paste Text" method
- Try different source

### "Extraction Failed" Generic Error

**Symptom:** Generic extraction failure message

**Solutions:**

**Check File:**
- Verify file isn't corrupted
- Try opening in native application
- Re-save and try again

**Check Format:**
- Ensure correct file extension
- Verify file type matches extension
- Convert to different format

**Try Alternative Method:**
- Use different input method
- Copy text manually
- Try smaller file first

**Contact Support:**
- Provide error details
- Include file type and size
- Describe steps taken

## Processing Issues

### Processing Takes Too Long

**Symptom:** Status stuck on "Processing" for > 2 minutes

**Expected Times:**
- Text files: < 1 second
- DOCX files: 1-3 seconds
- PDF files: 2-5 seconds
- URLs: 2-10 seconds

**Solutions:**

**Wait Longer:**
- Large PDFs can take 30-60 seconds
- Complex DOCX may take longer
- Don't refresh page

**Check Status:**
- Look for error messages
- Check browser console (F12)
- Verify network connection

**Retry:**
- Refresh page
- Upload again
- Try smaller file first

### "Insufficient Content" Error

**Symptom:** Error when generating content: "Insufficient content for generation"

**Possible Causes:**
1. Extracted text too short
2. Mostly non-text content
3. Extraction removed too much

**Solutions:**

**Check Preview:**
- View extracted text preview
- Verify meaningful content extracted
- Check if enough text present

**Minimum Content:**
```
Recommended minimum:
- Course: 500+ words
- Quiz: 200+ words
- Flashcards: 100+ words
- Guide: 300+ words
```

**Combine Sources:**
- Upload multiple documents
- Add more context
- Use longer source material

**Check Extraction:**
- Verify extraction worked correctly
- Try different file format
- Use direct text input

### Preview Shows Garbled Text

**Symptom:** Extracted text contains strange characters or formatting

**Possible Causes:**
1. Encoding issues
2. Special characters
3. Non-English text
4. Complex formatting

**Solutions:**

**Check Encoding:**
- Save file as UTF-8
- Remove special characters
- Use plain text format

**Clean Content:**
- Remove formatting in source
- Copy as plain text
- Paste into simple editor first

**Try Alternative:**
- Use different file format
- Copy text manually
- Clean in text editor first

## Generation Issues

### Content Generation Fails

**Symptom:** Error after clicking generate button

**Possible Causes:**
1. LLM service error
2. Network timeout
3. Invalid content
4. Server overload

**Solutions:**

**Retry:**
- Click generate again
- Wait a few seconds
- Try different AI provider

**Check Content:**
- Verify text is meaningful
- Ensure sufficient length
- Remove special characters

**Try Different Provider:**
- Switch AI provider in settings
- Try different model
- Check provider status

**Contact Support:**
- Provide error message
- Include content type
- Describe issue

### Generated Content Quality Issues

**Symptom:** Generated content is poor quality or irrelevant

**Solutions:**

**Improve Source:**
- Use higher quality source material
- Provide more context
- Remove irrelevant content

**Adjust Settings:**
- Try different AI provider
- Use different model
- Adjust generation parameters

**Edit Content:**
- Review and edit generated content
- Regenerate specific sections
- Combine multiple generations

## Browser Issues

### Upload Button Not Working

**Symptom:** Can't click upload button or nothing happens

**Solutions:**

**Check Browser:**
```
Supported browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
```

**Clear Cache:**
1. Open browser settings
2. Clear cache and cookies
3. Refresh page
4. Try again

**Disable Extensions:**
- Disable ad blockers
- Disable privacy extensions
- Try incognito mode

**Try Different Browser:**
- Test in Chrome
- Test in Firefox
- Update browser

### Drag and Drop Not Working

**Symptom:** Can't drag files to upload area

**Solutions:**

**Use Click Method:**
- Click "Select File" button
- Browse and select file
- Upload normally

**Check Browser:**
- Update to latest version
- Try different browser
- Check browser permissions

**Check File:**
- Verify file isn't locked
- Check file permissions
- Try different file

## Server Issues

### "Server Error" Messages

**Symptom:** Generic server error (500) messages

**Solutions:**

**Wait and Retry:**
- Server may be temporarily down
- Wait 5-10 minutes
- Try again

**Check Status:**
- Look for maintenance notices
- Check server status page
- Contact administrator

**Try Alternative:**
- Use different input method
- Try smaller file
- Try during off-peak hours

### "Authentication Required" Error

**Symptom:** Error 401 - Authentication required

**Solutions:**

**Re-authenticate:**
1. Log out
2. Clear browser cookies
3. Log back in
4. Try again

**Check Session:**
- Session may have expired
- Refresh page
- Log in again

**Check Account:**
- Verify account is active
- Check account status
- Contact support if needed

## Data & Privacy Issues

### Where Are My Files Stored?

**Answer:**
- Files stored temporarily during processing
- Automatically deleted after 5 minutes
- Files older than 1 hour cleaned up
- No permanent storage

### Can I Recover Deleted Files?

**Answer:**
- No, files are permanently deleted
- Keep original files on your device
- Re-upload if needed

### Who Can Access My Uploads?

**Answer:**
- Only you (the uploader)
- System administrators (for support)
- No other users
- Automatic cleanup ensures privacy

## Getting Help

### Before Contacting Support

Gather this information:
1. Error message (exact text)
2. File type and size
3. Browser and version
4. Steps to reproduce
5. Screenshots if possible

### Contact Channels

- Support email: support@example.com
- In-app help: Click "?" icon
- Documentation: docs.example.com
- Community forum: forum.example.com

### What to Include

**For Upload Issues:**
- File type and size
- Error message
- Browser used
- Upload method tried

**For Extraction Issues:**
- Source type (PDF/DOCX/URL)
- Error message
- File characteristics
- Preview content (if any)

**For Generation Issues:**
- Content type attempted
- AI provider selected
- Error message
- Source content length

## Quick Reference

### File Requirements
```
Format: PDF, DOCX, TXT
Size: Max 10MB
Type: Text-based (no scanned images)
```

### URL Requirements
```
Protocol: HTTP/HTTPS only
Access: Publicly accessible
Timeout: 10 seconds max
```

### Text Requirements
```
Length: Max 50,000 characters
Format: Plain text
Encoding: UTF-8 recommended
```

### Processing Times
```
Text: < 1 second
DOCX: 1-3 seconds
PDF: 2-5 seconds
URL: 2-10 seconds
```

### Common Solutions
```
1. Refresh page
2. Clear cache
3. Try different browser
4. Use alternative input method
5. Contact support
```
