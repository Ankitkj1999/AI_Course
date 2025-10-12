// MongoDB initialization script
db = db.getSiblingDB('aicourse');

// Create application user
db.createUser({
  user: 'aicourse_user',
  pwd: 'aicourse_password',
  roles: [
    {
      role: 'readWrite',
      db: 'aicourse'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.courses.createIndex({ "user": 1 });
db.courses.createIndex({ "mainTopic": 1 });
db.courses.createIndex({ "date": -1 });
db.subscriptions.createIndex({ "user": 1 });
db.subscriptions.createIndex({ "subscriberId": 1 });

print('Database initialized successfully');