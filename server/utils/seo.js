/**
 * Generate SEO meta tags for courses
 * @param {Object} course - Course object
 * @param {string} baseUrl - Base URL of the application
 * @returns {Object} - SEO meta data
 */
export const generateCourseSEO = (course, baseUrl = 'http://localhost:8080') => {
    const title = course.mainTopic || 'AI Generated Course';
    const description = generateMetaDescription(course.content, course.mainTopic);
    const url = `${baseUrl}/course/${course.slug}`;
    const image = course.photo || `${baseUrl}/default-course-image.jpg`;
    
    return {
        title: `${title} - Learn with AI Generated Course`,
        description,
        url,
        image,
        type: 'article',
        siteName: 'AiCourse',
        // Open Graph tags
        og: {
            title: `${title} - AI Generated Course`,
            description,
            url,
            image,
            type: 'article',
            siteName: 'AiCourse'
        },
        // Twitter Card tags
        twitter: {
            card: 'summary_large_image',
            title: `${title} - AI Generated Course`,
            description,
            image,
            site: '@aicourse'
        },
        // JSON-LD structured data
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": title,
            "description": description,
            "url": url,
            "image": image,
            "provider": {
                "@type": "Organization",
                "name": "AiCourse",
                "url": baseUrl
            },
            "educationalLevel": "Beginner to Advanced",
            "courseMode": "Online",
            "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "Online",
                "instructor": {
                    "@type": "Organization",
                    "name": "AI Assistant"
                }
            }
        }
    };
};

/**
 * Generate meta description from course content
 * @param {string} content - Course content (JSON string)
 * @param {string} mainTopic - Main topic as fallback
 * @returns {string} - Meta description
 */
export const generateMetaDescription = (content, mainTopic) => {
    try {
        const parsedContent = JSON.parse(content);
        
        // Try to extract description from content
        if (parsedContent.description) {
            return truncateText(parsedContent.description, 160);
        }
        
        if (parsedContent.overview) {
            return truncateText(parsedContent.overview, 160);
        }
        
        // Generate from lessons
        if (parsedContent.lessons && parsedContent.lessons.length > 0) {
            const lessonTitles = parsedContent.lessons
                .slice(0, 3)
                .map(lesson => lesson.title || lesson.name)
                .filter(Boolean)
                .join(', ');
            
            if (lessonTitles) {
                return `Learn ${mainTopic} with AI-generated course covering: ${lessonTitles} and more.`;
            }
        }
        
        // Fallback description
        return `Comprehensive AI-generated course on ${mainTopic}. Learn at your own pace with structured lessons and practical examples.`;
        
    } catch (error) {
        // Fallback if content parsing fails
        return `Learn ${mainTopic} with our AI-generated course. Comprehensive lessons designed for effective learning.`;
    }
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 160) => {
    if (!text || text.length <= maxLength) return text;
    
    // Find the last space before maxLength to avoid cutting words
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
        return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
};

/**
 * Generate sitemap entry for course
 * @param {Object} course - Course object
 * @param {string} baseUrl - Base URL
 * @returns {Object} - Sitemap entry
 */
export const generateSitemapEntry = (course, baseUrl = 'http://localhost:8080') => {
    return {
        url: `${baseUrl}/course/${course.slug}`,
        lastmod: course.date || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8
    };
};