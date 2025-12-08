# Railway Database Setup Instructions

## Add DATABASE_URL Environment Variable

In your Railway dashboard, you need to add the DATABASE_URL environment variable:

1. Go to your Railway project
2. Click on your web service (not the database)
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add the following:

**Variable Name:** `DATABASE_URL`
**Value:**
```
postgresql://${{PGUSER}}:${{PGPASSWORD}}@${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
```

Or use this exact value based on your screenshot:
```
postgresql://postgres:fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt@postgres.railway.internal:5432/railway
```

## Alternative: Use Railway's Database Reference

1. In the Variables tab of your web service
2. Click "New Variable"
3. Name: `DATABASE_URL`
4. Click the database icon to reference your PostgreSQL database
5. Select your PostgreSQL service
6. Choose `DATABASE_URL` from the dropdown

This will automatically create the correct connection string.

## Verify Connection

After setting the DATABASE_URL, your deployment should:
1. Connect to the database successfully
2. Run migrations automatically
3. Create all necessary tables

## Important Notes

- Railway's internal URL (`postgres.railway.internal`) only works within Railway's network
- If you need external access, use the public URL instead
- The password shown in your screenshot: `fnkujYsPXAdmDWAbCxFTeQLtARLIDtZt`