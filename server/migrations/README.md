# Database Migration Scripts

This directory contains migration scripts for database schema changes.

## Visibility and Fork Fields Migration

### Overview
This migration adds public/private visibility controls and fork tracking to all content types (Courses, Quizzes, Flashcards, and Guides).

### Fields Added
- `isPublic` (Boolean): Controls whether content is publicly visible (default: false)
- `forkCount` (Number): Tracks how many times content has been forked (default: 0)
- `forkedFrom` (Object): Contains metadata about the original content if this is a fork
  - `contentId`: Reference to original content
  - `originalOwnerId`: User ID of original owner
  - `originalOwnerName`: Display name of original owner
  - `forkedAt`: Timestamp of fork operation
- `ownerName` (String): Display name of content owner (populated from User collection)

### Indexes Created
Compound indexes for efficient public content queries:
- Courses: `{ isPublic: 1, date: -1 }`
- Quizzes: `{ isPublic: 1, createdAt: -1 }`
- Flashcards: `{ isPublic: 1, createdAt: -1 }`
- Guides: `{ isPublic: 1, createdAt: -1 }`

## Running the Migration

### Prerequisites
1. Ensure MongoDB is running and accessible
2. Verify `.env` file in `server/` directory has correct `MONGODB_URI`
3. Backup your database before running migration

### Execute Migration
```bash
# From the project root
node server/migrations/add-visibility-fork-fields.js
```

### Expected Output
```
MongoDB connected for migration
Starting migration: Adding visibility and fork fields...

Loaded X users for name mapping

Migrating Courses...
✓ Migrated X courses

Migrating Quizzes...
✓ Migrated X quizzes

Migrating Flashcards...
✓ Migrated X flashcards

Migrating Guides...
✓ Migrated X guides

Creating database indexes...
✓ Created compound indexes for efficient public content queries

Migration completed successfully!
Total migrated: X items

Closing database connection...
Migration complete. Exiting.
```

## Rolling Back the Migration

If you need to revert the changes:

```bash
# From the project root
node server/migrations/rollback-visibility-fork-fields.js
```

This will:
1. Remove all visibility and fork fields from content documents
2. Drop the compound indexes created for public content queries

### Expected Rollback Output
```
MongoDB connected for rollback
Starting rollback: Removing visibility and fork fields...

Rolling back Courses...
✓ Rolled back X courses

Rolling back Quizzes...
✓ Rolled back X quizzes

Rolling back Flashcards...
✓ Rolled back X flashcards

Rolling back Guides...
✓ Rolled back X guides

Dropping database indexes...
✓ Dropped Course index
✓ Dropped Quiz index
✓ Dropped Flashcard index
✓ Dropped Guide index

Rollback completed successfully!
Total rolled back: X items

Closing database connection...
Rollback complete. Exiting.
```

## Testing the Migration

### Before Migration
1. Count existing content items
2. Verify no `isPublic`, `forkCount`, `forkedFrom`, or `ownerName` fields exist

### After Migration
1. Verify all content items have new fields with correct default values
2. Check that `ownerName` is populated from User collection
3. Verify indexes are created:
   ```javascript
   // In MongoDB shell
   db.courses.getIndexes()
   db.quizzes.getIndexes()
   db.flashcards.getIndexes()
   db.guides.getIndexes()
   ```

### Sample Verification Query
```javascript
// Check a few documents to verify migration
db.quizzes.findOne({}, { 
  isPublic: 1, 
  forkCount: 1, 
  forkedFrom: 1, 
  ownerName: 1 
})
```

## Troubleshooting

### Migration Fails Midway
- Check MongoDB connection
- Verify sufficient disk space
- Check error logs for specific issues
- Run rollback script if needed
- Fix issues and re-run migration

### User Names Not Populated
- Verify User collection has data
- Check that content `userId` fields match User `_id` values
- Users without names will show as "Unknown User"

### Index Creation Fails
- Check for existing indexes with same name
- Verify MongoDB version supports compound indexes
- Check database permissions

## Notes

- Migration is idempotent - safe to run multiple times
- Existing content defaults to private (`isPublic: false`)
- No data is deleted, only new fields are added
- Rollback removes added fields but preserves all original data
- Always backup your database before running migrations
