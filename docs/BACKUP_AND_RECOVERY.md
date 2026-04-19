# Backup and Recovery Runbook

## Backup Policy
- MongoDB Atlas automated snapshots must remain enabled.
- Daily backup window: `00:30 IST`.
- Retention: `7 daily`, `4 weekly`, `6 monthly`.
- Before any bulk archive/delete action, take an on-demand snapshot.

## Recovery Objectives
- RPO: 24 hours max.
- RTO: 2 hours target.

## Pre-Delete Safety Checklist
1. Confirm action scope (student count + filters) in UI preview.
2. Export impacted records before delete/archive.
3. Capture operator details and change ticket.
4. Verify latest snapshot exists and is healthy.

## Restore Procedure (High Level)
1. Create a temporary restore cluster from latest snapshot.
2. Validate required collections (`users`, `archivedstudents`, `notifications`).
3. Restore target documents using `mongodump/mongorestore` or Atlas live restore.
4. Run application integrity checks (login, fees, board change, lifecycle views).
5. Notify admins and record post-incident report.

## Validation Checklist After Recovery
- Student login and admin login successful.
- Fee totals and payment history match expected values.
- Board-change requests and audit logs are consistent.
- Archived/deleted lifecycle states are accurate.

## Ownership
- Primary Owner: Platform Admin
- Escalation: SUPER_ADMIN on-call
