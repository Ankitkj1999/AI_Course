import mongoose from 'mongoose';

/**
 * Enhanced Language Model
 * Supports both course-level and section-level language preferences
 */
const languageSchema = new mongoose.Schema({
    // User who set the language preference
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    
    // Course reference (always required)
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true, 
        index: true 
    },
    
    // Section reference (optional - null means course-level language)
    sectionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Section', 
        default: null, 
        index: true 
    },
    
    // Language settings
    lang: { 
        type: String, 
        required: true,
        default: 'English'
    },
    
    // Language code (ISO 639-1)
    langCode: {
        type: String,
        default: 'en'
    },
    
    // Language direction (for RTL languages)
    direction: {
        type: String,
        enum: ['ltr', 'rtl'],
        default: 'ltr'
    },
    
    // Translation preferences
    autoTranslate: {
        type: Boolean,
        default: false
    },
    
    // Preferred translation service
    translationService: {
        type: String,
        enum: ['google', 'microsoft', 'deepl', 'manual'],
        default: 'google'
    },
    
    // Content language metadata
    originalLanguage: {
        type: String,
        default: 'English'
    },
    
    originalLangCode: {
        type: String,
        default: 'en'
    },
    
    // Translation quality/confidence
    translationQuality: {
        type: String,
        enum: ['high', 'medium', 'low', 'manual'],
        default: 'high'
    },
    
    // User preferences
    preferences: {
        showOriginal: { type: Boolean, default: false },
        showTranslation: { type: Boolean, default: true },
        fontSize: { type: String, default: 'medium' },
        fontFamily: { type: String, default: 'default' }
    },
    
    // Legacy course field for backward compatibility
    course: { 
        type: String, 
        index: true 
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
languageSchema.index({ userId: 1, courseId: 1 });
languageSchema.index({ userId: 1, courseId: 1, sectionId: 1 });
languageSchema.index({ courseId: 1, sectionId: 1 });
languageSchema.index({ langCode: 1, courseId: 1 });

// Pre-save middleware
languageSchema.pre('save', async function(next) {
    try {
        // Set legacy course field if courseId is provided and course field is not set
        if (this.courseId && !this.course) {
            try {
                const Course = mongoose.model('Course');
                const course = await Course.findById(this.courseId).select('slug');
                if (course && course.slug) {
                    this.course = course.slug;
                }
            } catch (courseError) {
                // Log error but don't fail the save
                console.warn('Failed to set legacy course field:', courseError.message);
            }
        }
        
        // Set language code if not provided
        if (!this.langCode && this.lang) {
            this.langCode = this.getLanguageCode(this.lang);
        }
        
        // Set direction based on language
        if (this.langCode) {
            this.direction = this.getLanguageDirection(this.langCode);
        }
        
        next();
    } catch (error) {
        console.error('Language pre-save middleware error:', error);
        // Don't fail the save for non-critical errors
        next();
    }
});

// Instance methods
languageSchema.methods.getScope = function() {
    return this.sectionId ? 'section' : 'course';
};

languageSchema.methods.getReference = function() {
    return {
        type: this.getScope(),
        courseId: this.courseId,
        sectionId: this.sectionId,
        course: this.course // Legacy field
    };
};

languageSchema.methods.getLanguageCode = function(languageName) {
    const languageMap = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Italian': 'it',
        'Portuguese': 'pt',
        'Russian': 'ru',
        'Chinese': 'zh',
        'Japanese': 'ja',
        'Korean': 'ko',
        'Arabic': 'ar',
        'Hindi': 'hi',
        'Dutch': 'nl',
        'Swedish': 'sv',
        'Norwegian': 'no',
        'Danish': 'da',
        'Finnish': 'fi',
        'Polish': 'pl',
        'Czech': 'cs',
        'Hungarian': 'hu',
        'Turkish': 'tr',
        'Greek': 'el',
        'Hebrew': 'he',
        'Thai': 'th',
        'Vietnamese': 'vi',
        'Indonesian': 'id',
        'Malay': 'ms',
        'Filipino': 'fil',
        'Ukrainian': 'uk',
        'Bulgarian': 'bg',
        'Romanian': 'ro',
        'Croatian': 'hr',
        'Serbian': 'sr',
        'Slovak': 'sk',
        'Slovenian': 'sl',
        'Estonian': 'et',
        'Latvian': 'lv',
        'Lithuanian': 'lt'
    };
    
    return languageMap[languageName] || 'en';
};

languageSchema.methods.getLanguageDirection = function(langCode) {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi'];
    return rtlLanguages.includes(langCode) ? 'rtl' : 'ltr';
};

languageSchema.methods.isRTL = function() {
    return this.direction === 'rtl';
};

languageSchema.methods.needsTranslation = function() {
    return this.langCode !== this.originalLangCode && this.autoTranslate;
};

// Static methods
languageSchema.statics.findByUser = function(userId, options = {}) {
    const { courseId, sectionId, langCode } = options;
    
    const query = { userId };
    if (courseId) query.courseId = courseId;
    if (sectionId !== undefined) query.sectionId = sectionId;
    if (langCode) query.langCode = langCode;
    
    return this.find(query).sort({ updatedAt: -1 });
};

languageSchema.statics.findByCourse = function(courseId, options = {}) {
    const { userId, sectionId, langCode } = options;
    
    const query = { courseId };
    if (userId) query.userId = userId;
    if (sectionId !== undefined) query.sectionId = sectionId;
    if (langCode) query.langCode = langCode;
    
    return this.find(query).sort({ updatedAt: -1 });
};

languageSchema.statics.findBySection = function(sectionId, options = {}) {
    const { userId, langCode } = options;
    
    const query = { sectionId };
    if (userId) query.userId = userId;
    if (langCode) query.langCode = langCode;
    
    return this.find(query).sort({ updatedAt: -1 });
};

languageSchema.statics.getUserLanguagePreference = async function(userId, courseId, sectionId = null) {
    // Try to find section-specific preference first
    if (sectionId) {
        const sectionPref = await this.findOne({ userId, courseId, sectionId });
        if (sectionPref) return sectionPref;
    }
    
    // Fall back to course-level preference
    const coursePref = await this.findOne({ userId, courseId, sectionId: null });
    if (coursePref) return coursePref;
    
    // Return default if no preference found
    return {
        lang: 'English',
        langCode: 'en',
        direction: 'ltr',
        autoTranslate: false,
        preferences: {
            showOriginal: false,
            showTranslation: true,
            fontSize: 'medium',
            fontFamily: 'default'
        }
    };
};

languageSchema.statics.setUserLanguagePreference = async function(userId, courseId, sectionId, languageData) {
    const query = { userId, courseId, sectionId };
    
    const update = {
        ...languageData,
        updatedAt: new Date()
    };
    
    return await this.findOneAndUpdate(query, update, { 
        upsert: true, 
        new: true 
    });
};

languageSchema.statics.getCourseLanguageStats = async function(courseId) {
    const pipeline = [
        { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: '$langCode',
                count: { $sum: 1 },
                language: { $first: '$lang' },
                users: { $addToSet: '$userId' }
            }
        },
        {
            $project: {
                langCode: '$_id',
                language: 1,
                count: 1,
                userCount: { $size: '$users' }
            }
        },
        { $sort: { count: -1 } }
    ];
    
    return await this.aggregate(pipeline);
};

// Migration helper for existing language preferences
languageSchema.statics.migrateFromLegacy = async function(legacyLanguages) {
    const Course = mongoose.model('Course');
    const migrated = [];
    
    for (const lang of legacyLanguages) {
        try {
            // Find course by slug (legacy course field)
            const course = await Course.findOne({ slug: lang.course });
            if (!course) {
                console.warn(`Course not found for legacy language: ${lang.course}`);
                continue;
            }
            
            // Create new language preference with enhanced schema
            const newLang = new this({
                userId: lang.userId || 'unknown', // May need to be set manually
                courseId: course._id,
                sectionId: null, // Course-level language preference
                lang: lang.lang || 'English',
                course: lang.course, // Maintain legacy field
                autoTranslate: false, // Default for legacy
                originalLanguage: 'English', // Assume original was English
                originalLangCode: 'en'
            });
            
            await newLang.save();
            migrated.push(newLang);
        } catch (error) {
            console.error(`Failed to migrate language for course ${lang.course}:`, error);
        }
    }
    
    return migrated;
};

languageSchema.statics.getSupportedLanguages = function() {
    return [
        { name: 'English', code: 'en', direction: 'ltr' },
        { name: 'Spanish', code: 'es', direction: 'ltr' },
        { name: 'French', code: 'fr', direction: 'ltr' },
        { name: 'German', code: 'de', direction: 'ltr' },
        { name: 'Italian', code: 'it', direction: 'ltr' },
        { name: 'Portuguese', code: 'pt', direction: 'ltr' },
        { name: 'Russian', code: 'ru', direction: 'ltr' },
        { name: 'Chinese', code: 'zh', direction: 'ltr' },
        { name: 'Japanese', code: 'ja', direction: 'ltr' },
        { name: 'Korean', code: 'ko', direction: 'ltr' },
        { name: 'Arabic', code: 'ar', direction: 'rtl' },
        { name: 'Hindi', code: 'hi', direction: 'ltr' },
        { name: 'Dutch', code: 'nl', direction: 'ltr' },
        { name: 'Swedish', code: 'sv', direction: 'ltr' },
        { name: 'Norwegian', code: 'no', direction: 'ltr' },
        { name: 'Danish', code: 'da', direction: 'ltr' },
        { name: 'Finnish', code: 'fi', direction: 'ltr' },
        { name: 'Polish', code: 'pl', direction: 'ltr' },
        { name: 'Czech', code: 'cs', direction: 'ltr' },
        { name: 'Hungarian', code: 'hu', direction: 'ltr' },
        { name: 'Turkish', code: 'tr', direction: 'ltr' },
        { name: 'Greek', code: 'el', direction: 'ltr' },
        { name: 'Hebrew', code: 'he', direction: 'rtl' },
        { name: 'Thai', code: 'th', direction: 'ltr' },
        { name: 'Vietnamese', code: 'vi', direction: 'ltr' },
        { name: 'Indonesian', code: 'id', direction: 'ltr' },
        { name: 'Malay', code: 'ms', direction: 'ltr' },
        { name: 'Filipino', code: 'fil', direction: 'ltr' },
        { name: 'Ukrainian', code: 'uk', direction: 'ltr' },
        { name: 'Bulgarian', code: 'bg', direction: 'ltr' },
        { name: 'Romanian', code: 'ro', direction: 'ltr' },
        { name: 'Croatian', code: 'hr', direction: 'ltr' },
        { name: 'Serbian', code: 'sr', direction: 'ltr' },
        { name: 'Slovak', code: 'sk', direction: 'ltr' },
        { name: 'Slovenian', code: 'sl', direction: 'ltr' },
        { name: 'Estonian', code: 'et', direction: 'ltr' },
        { name: 'Latvian', code: 'lv', direction: 'ltr' },
        { name: 'Lithuanian', code: 'lt', direction: 'ltr' }
    ];
};

export default mongoose.model('Language', languageSchema);