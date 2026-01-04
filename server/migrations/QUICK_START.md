# Quick Start: Running the Migration

## Prerequisites
✅ MongoDB is running  
✅ `.env` file configured in `server/` directory  
✅ Database backup completed  

## Run Migration

```bash
# From project root
node server/migrations/add-visibility-fork-fields.js
```

## Verify Migration

```bash
# From project root
node server/migrations/verify-schema.js
```

## Rollback (if needed)

```bash
# From project root
node server/migrations/rollback-visibility-fork-fields.js
```

## What Gets Added

Each content item (Course, Quiz, Flashcard, Guide) will have:
- `isPublic: false` - Content is private by default
- `forkCount: 0` - No forks initially
- `forkedFrom: null` - Not a fork
- `ownerName: "User Name"` - Populated from User collection

## Expected Runtime

- Small database (<1000 items): ~5-10 seconds
- Medium database (1000-10000 items): ~30-60 seconds
- Large database (>10000 items): ~2-5 minutes

## Troubleshooting

**Connection Error?**
- Check MongoDB is running
- Verify MONGODB_URI in `.env`

**Migration Fails?**
- Check error message
- Run rollback script
- Fix issue and retry

**Need Help?**
- See full documentation in `README.md`
- Check `IMPLEMENTATION_SUMMARY.md` for details
