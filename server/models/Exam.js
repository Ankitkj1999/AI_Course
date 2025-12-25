import mongoose from 'mongoose';

/**
 * Enhanced Exam Model
 * Supports both course-level and section-level exams
 */
const examSchema = new mongoose.Schema({
    // User who took the exam
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
    
    // Section reference (optional - null means course-level exam)
    sectionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Section', 
        default: null, 
        index: true 
    },
    
    // Exam content and results
    exam: { 
        type: String, 
        required: true 
    },
    
    // Exam metadata
    title: { 
        type: String, 
        default: '' 
    },
    
    examType: {
        type: String,
        enum: ['quiz', 'test', 'final', 'practice'],
        default: 'quiz'
    },
    
    // Scoring
    marks: { 
        type: String, 
        required: true 
    },
    
    totalQuestions: { 
        type: Number, 
        default: 0 
    },
    
    correctAnswers: { 
        type: Number, 
        default: 0 
    },
    
    scorePercentage: { 
        type: Number, 
        default: 0 
    },
    
    passed: { 
        type: Boolean, 
        default: false 
    },
    
    passingScore: { 
        type: Number, 
        default: 70 // 70% default passing score
    },
    
    // Timing
    timeSpent: { 
        type: Number, 
        default: 0 // in seconds
    },
    
    startedAt: { 
        type: Date 
    },
    
    completedAt: { 
        type: Date 
    },
    
    // Attempt tracking
    attemptNumber: { 
        type: Number, 
        default: 1 
    },
    
    maxAttempts: { 
        type: Number, 
        default: 3 
    },
    
    // Detailed results
    answers: [{
        questionId: String,
        question: String,
        userAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        points: Number
    }],
    
    // Legacy course field for backward compatibility
    course: { 
        type: String, 
        index: true 
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
examSchema.index({ userId: 1, courseId: 1 });
examSchema.index({ userId: 1, courseId: 1, sectionId: 1 });
examSchema.index({ courseId: 1, sectionId: 1, passed: 1 });
examSchema.index({ userId: 1, passed: 1, createdAt: -1 });

// Pre-save middleware
examSchema.pre('save', async function(next) {
    try {
        // Set legacy course field if courseId is provided
        if (this.courseId && !this.course) {
            const Course = mongoose.model('Course');
            const course = await Course.findById(this.courseId).select('slug');
            if (course) {
                this.course = course.slug;
            }
        }
        
        // Calculate score percentage if not set
        if (this.totalQuestions > 0 && this.scorePercentage === 0) {
            this.scorePercentage = Math.round((this.correctAnswers / this.totalQuestions) * 100);
        }
        
        // Determine if passed based on score
        if (this.scorePercentage >= this.passingScore) {
            this.passed = true;
        }
        
        // Set completion time if not set and exam is completed
        if (this.passed && !this.completedAt) {
            this.completedAt = new Date();
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
examSchema.methods.getScope = function() {
    return this.sectionId ? 'section' : 'course';
};

examSchema.methods.getReference = function() {
    return {
        type: this.getScope(),
        courseId: this.courseId,
        sectionId: this.sectionId,
        course: this.course // Legacy field
    };
};

examSchema.methods.calculateScore = function() {
    if (this.answers && this.answers.length > 0) {
        this.totalQuestions = this.answers.length;
        this.correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
        this.scorePercentage = Math.round((this.correctAnswers / this.totalQuestions) * 100);
        this.passed = this.scorePercentage >= this.passingScore;
    }
    return {
        totalQuestions: this.totalQuestions,
        correctAnswers: this.correctAnswers,
        scorePercentage: this.scorePercentage,
        passed: this.passed
    };
};

examSchema.methods.getTimeSpentFormatted = function() {
    if (!this.timeSpent) return '0 minutes';
    
    const minutes = Math.floor(this.timeSpent / 60);
    const seconds = this.timeSpent % 60;
    
    if (minutes > 0) {
        return `${minutes} minutes ${seconds > 0 ? `${seconds} seconds` : ''}`.trim();
    }
    return `${seconds} seconds`;
};

// Static methods
examSchema.statics.findByUser = function(userId, options = {}) {
    const { courseId, sectionId, passed, examType } = options;
    
    const query = { userId };
    if (courseId) query.courseId = courseId;
    if (sectionId !== undefined) query.sectionId = sectionId;
    if (passed !== undefined) query.passed = passed;
    if (examType) query.examType = examType;
    
    return this.find(query).sort({ createdAt: -1 });
};

examSchema.statics.findByCourse = function(courseId, options = {}) {
    const { userId, sectionId, passed, examType } = options;
    
    const query = { courseId };
    if (userId) query.userId = userId;
    if (sectionId !== undefined) query.sectionId = sectionId;
    if (passed !== undefined) query.passed = passed;
    if (examType) query.examType = examType;
    
    return this.find(query).sort({ createdAt: -1 });
};

examSchema.statics.findBySection = function(sectionId, options = {}) {
    const { userId, passed, examType } = options;
    
    const query = { sectionId };
    if (userId) query.userId = userId;
    if (passed !== undefined) query.passed = passed;
    if (examType) query.examType = examType;
    
    return this.find(query).sort({ createdAt: -1 });
};

examSchema.statics.getUserProgress = async function(userId, courseId) {
    const exams = await this.find({ userId, courseId });
    
    const progress = {
        totalExams: exams.length,
        passedExams: exams.filter(exam => exam.passed).length,
        averageScore: 0,
        totalTimeSpent: 0,
        lastExamDate: null,
        examsBySection: {}
    };
    
    if (exams.length > 0) {
        progress.averageScore = Math.round(
            exams.reduce((sum, exam) => sum + exam.scorePercentage, 0) / exams.length
        );
        progress.totalTimeSpent = exams.reduce((sum, exam) => sum + (exam.timeSpent || 0), 0);
        progress.lastExamDate = Math.max(...exams.map(exam => exam.createdAt));
        
        // Group by section
        exams.forEach(exam => {
            const sectionKey = exam.sectionId ? exam.sectionId.toString() : 'course';
            if (!progress.examsBySection[sectionKey]) {
                progress.examsBySection[sectionKey] = {
                    total: 0,
                    passed: 0,
                    averageScore: 0,
                    exams: []
                };
            }
            
            progress.examsBySection[sectionKey].total++;
            if (exam.passed) progress.examsBySection[sectionKey].passed++;
            progress.examsBySection[sectionKey].exams.push(exam);
        });
        
        // Calculate section averages
        Object.keys(progress.examsBySection).forEach(sectionKey => {
            const sectionExams = progress.examsBySection[sectionKey].exams;
            progress.examsBySection[sectionKey].averageScore = Math.round(
                sectionExams.reduce((sum, exam) => sum + exam.scorePercentage, 0) / sectionExams.length
            );
        });
    }
    
    return progress;
};

// Migration helper for existing exams
examSchema.statics.migrateFromLegacy = async function(legacyExams) {
    const Course = mongoose.model('Course');
    const migrated = [];
    
    for (const exam of legacyExams) {
        try {
            // Find course by slug (legacy course field)
            const course = await Course.findOne({ slug: exam.course });
            if (!course) {
                console.warn(`Course not found for legacy exam: ${exam.course}`);
                continue;
            }
            
            // Create new exam with enhanced schema
            const newExam = new this({
                userId: exam.userId || 'unknown', // May need to be set manually
                courseId: course._id,
                sectionId: null, // Course-level exam
                exam: exam.exam,
                marks: exam.marks,
                passed: exam.passed || false,
                course: exam.course, // Maintain legacy field
                examType: 'quiz', // Default type for legacy exams
                scorePercentage: this.parseMarksToPercentage(exam.marks)
            });
            
            await newExam.save();
            migrated.push(newExam);
        } catch (error) {
            console.error(`Failed to migrate exam for course ${exam.course}:`, error);
        }
    }
    
    return migrated;
};

examSchema.statics.parseMarksToPercentage = function(marks) {
    if (!marks) return 0;
    
    // Try to parse marks like "8/10", "15/20", etc.
    const match = marks.match(/(\d+)\/(\d+)/);
    if (match) {
        const [, correct, total] = match;
        return Math.round((parseInt(correct) / parseInt(total)) * 100);
    }
    
    // Try to parse percentage like "85%"
    const percentMatch = marks.match(/(\d+)%/);
    if (percentMatch) {
        return parseInt(percentMatch[1]);
    }
    
    // Default to 0 if can't parse
    return 0;
};

export default mongoose.model('Exam', examSchema);