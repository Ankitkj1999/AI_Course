#!/bin/bash

# Script to remove Phase 1 legacy course routes from server.js

echo "Starting Phase 1 route removal..."

# Remove POST /api/update (lines 1067-1087)
echo "Removing POST /api/update..."
sed -i.phase1_1 '1067,1087d' server.js

# Remove POST /api/deletecourse (lines now shifted)
echo "Removing POST /api/deletecourse..."
sed -i.phase1_2 '1068,1077d' server.js

# Remove duplicate GET /api/course/:courseId/progress (first occurrence)
echo "Removing duplicate GET /api/course/:courseId/progress..."
sed -i.phase1_3 '908,974d' server.js

echo "Phase 1 removal complete!"
echo "Checking syntax..."
node --check server.js

if [ $? -eq 0 ]; then
    echo "✅ Syntax check passed!"
    wc -l server.js
else
    echo "❌ Syntax error detected!"
    exit 1
fi
