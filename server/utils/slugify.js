/**
 * Generate SEO-friendly slug from text
 * @param {string} text - Text to convert to slug
 * @param {number} maxLength - Maximum length of slug (default: 60)
 * @returns {string} - SEO-friendly slug
 */
export const generateSlug = (text, maxLength = 60) => {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .trim()
        // Replace spaces and special characters with hyphens
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '')
        // Limit length
        .substring(0, maxLength)
        // Remove trailing hyphen if cut off mid-word
        .replace(/-+$/, '');
};

/**
 * Generate unique slug for course
 * @param {string} title - Course title
 * @param {Object} Course - Mongoose Course model
 * @returns {string} - Unique slug
 */
export const generateUniqueSlug = async (title, Course) => {
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists and make it unique
    while (await Course.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    
    return slug;
};

/**
 * Extract course title from content for slug generation
 * @param {string} content - Course content (JSON string)
 * @param {string} mainTopic - Main topic as fallback
 * @returns {string} - Extracted title
 */
export const extractTitleFromContent = (content, mainTopic) => {
    try {
        const parsedContent = JSON.parse(content);
        
        // Try to find title in various possible locations
        if (parsedContent.title) {
            return parsedContent.title;
        }
        
        if (parsedContent.courseName) {
            return parsedContent.courseName;
        }
        
        if (parsedContent.name) {
            return parsedContent.name;
        }
        
        // If content has lessons, try to extract from first lesson
        if (parsedContent.lessons && parsedContent.lessons.length > 0) {
            const firstLesson = parsedContent.lessons[0];
            if (firstLesson.title) {
                return `${mainTopic} - ${firstLesson.title}`;
            }
        }
        
        // Fallback to mainTopic
        return mainTopic || 'untitled-course';
        
    } catch (error) {
        // If content is not valid JSON, use mainTopic
        return mainTopic || 'untitled-course';
    }
};