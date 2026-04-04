#!/bin/bash
# Restore production data to local database from JSON backups

BACKUP_DIR="$HOME/Desktop/Projects/ticketsSchool/backups/daily"
DATE="20251231"

# Local database credentials
export PGPASSWORD="tickets_password"
DB_HOST="localhost"
DB_PORT="6000"
DB_USER="tickets_user"
DB_NAME="tickets_school"

echo "========================================="
echo "Restoring production data to local database"
echo "========================================="

# Restore Schools
echo "Restoring Schools..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY \"School\" (id, name, slug, logo, \"primaryColor\", \"isActive\", \"createdAt\", \"updatedAt\", plan, \"stripeCustomerId\", \"stripeSubscriptionId\", \"subscriptionStatus\", \"trialEndsAt\", \"subscriptionEndsAt\")
FROM STDIN WITH (FORMAT CSV, QUOTE '\"', ESCAPE '\\', NULL '');
" < <(cat "$BACKUP_DIR/schools_$DATE.json" | jq -r '.[] | [.id, .name, .slug, .logo, .primaryColor, .isActive, .createdAt, .updatedAt, .plan, .stripeCustomerId, .stripeSubscriptionId, .subscriptionStatus, .trialEndsAt, .subscriptionEndsAt] | @csv')

# Restore Admins
echo "Restoring Admins..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY \"Admin\" (id, email, \"passwordHash\", name, role, \"schoolId\", \"emailVerified\", \"verificationToken\", \"resetToken\", \"resetTokenExpiry\", \"googleId\", \"isActive\", \"lastLoginAt\", \"createdAt\", \"updatedAt\", \"onboardingCompleted\")
FROM STDIN WITH (FORMAT CSV, QUOTE '\"', ESCAPE '\\', NULL '');
" < <(cat "$BACKUP_DIR/admins_$DATE.json" | jq -r '.[] | [.id, .email, .passwordHash, .name, .role, .schoolId, .emailVerified, .verificationToken, .resetToken, .resetTokenExpiry, .googleId, .isActive, .lastLoginAt, .createdAt, .updatedAt, .onboardingCompleted] | @csv')

# Restore Events
echo "Restoring Events..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY \"Event\" (id, name, description, location, \"eventDate\", capacity, \"spotsReserved\", \"schoolId\", \"createdAt\", \"updatedAt\", \"deletedAt\", \"eventType\", \"minAttendees\", \"maxAttendees\", \"closedManually\", \"closedAt\", \"cancelReason\", status)
FROM STDIN WITH (FORMAT CSV, QUOTE '\"', ESCAPE '\\', NULL '');
" < <(cat "$BACKUP_DIR/events_$DATE.json" | jq -r '.[] | [.id, .name, .description, .location, .eventDate, .capacity, .spotsReserved, .schoolId, .createdAt, .updatedAt, .deletedAt, .eventType, .minAttendees, .maxAttendees, .closedManually, .closedAt, .cancelReason, .status] | @csv')

# Restore Registrations
echo "Restoring Registrations..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
COPY \"Registration\" (id, \"eventId\", \"parentName\", \"parentPhone\", \"childName\", \"childGrade\", status, \"createdAt\", \"updatedAt\", \"spotsCount\", \"confirmationCode\", \"deletedAt\", \"schoolId\")
FROM STDIN WITH (FORMAT CSV, QUOTE '\"', ESCAPE '\\', NULL '');
" < <(cat "$BACKUP_DIR/registrations_$DATE.json" | jq -r '.[] | [.id, .eventId, .parentName, .parentPhone, .childName, .childGrade, .status, .createdAt, .updatedAt, .spotsCount, .confirmationCode, .deletedAt, .schoolId] | @csv')

unset PGPASSWORD

echo "========================================="
echo "✅ Restoration complete!"
echo "========================================="

# Show summary
PGPASSWORD="tickets_password" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT
  'Events' as table_name, COUNT(*) as count FROM \"Event\"
UNION ALL SELECT 'Registrations', COUNT(*) FROM \"Registration\"
UNION ALL SELECT 'Schools', COUNT(*) FROM \"School\"
UNION ALL SELECT 'Admins', COUNT(*) FROM \"Admin\";
"
