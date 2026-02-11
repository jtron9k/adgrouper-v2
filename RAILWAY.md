# Railway Deployment Guide

## Required Environment Variables

You **must** set these environment variables in Railway for the app to work:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SESSION_SECRET=your-secret-at-least-32-characters-long
```

### Configure Access

1. **Add Approved Emails**:
   - Add each user's email to the `approved_emails` table in your database
   - Only emails in this table can sign in
   - No user registration—admins add emails manually

2. **Get Supabase Keys**:
   - Go to Supabase dashboard → Project Settings → API
   - Copy the anon key and service role key
   - **Important:** Keep the service role key secret—it bypasses all RLS

3. **Session Secret**:
   - `SESSION_SECRET` signs session cookies (32+ characters)
   - Use a random string in production (e.g. `openssl rand -base64 32`)

### How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `SESSION_SECRET` - Your session signing secret (32+ chars)

## Build Configuration

Railway should automatically detect Next.js and use:
- Build Command: `npm run build`
- Start Command: `npm start`

If not, set these manually in Railway:
- Build Command: `npm run build`
- Start Command: `npm start`

## Troubleshooting 500 Errors

### 1. Check Environment Variables
Make sure all four required variables are set in Railway.

### 2. Check Build Logs
Look at the Railway build logs to see if there are any build errors.

### 3. Check Runtime Logs
Check the Railway runtime logs for any error messages.

### 4. Common Issues

**Missing Environment Variables:**
- Error: `SUPABASE_SERVICE_ROLE_KEY is required` or `SESSION_SECRET must be set`
- Solution: Add the environment variables in Railway

**Database Connection Issues:**
- Make sure your Supabase project is active
- Verify the URL and keys are correct

**Build Failures:**
- Check that Node.js version is 18+ (Railway should auto-detect)
- Ensure all dependencies install correctly

## Port Configuration

Railway automatically sets the `PORT` environment variable. Next.js will use this automatically, so no configuration needed.

## Health Check

The app should respond at the root URL `/` after successful deployment.

## Current Configuration

- **Authentication**: Email-only access—user enters email, app checks if it's in `approved_emails` table. No passwords, no magic links.

**⚠️ Important**:
- Add each user's email to the `approved_emails` table—only approved emails can sign in
- Users cannot self-register; admins must add emails manually
