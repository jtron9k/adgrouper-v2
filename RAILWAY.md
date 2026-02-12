# Railway Deployment Guide

## Required Environment Variables

You **must** set these environment variables in Railway for the app to work:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
AUTH_SESSION_SECRET=your-long-random-secret-here
```

### Configure Authentication in Supabase

1. **Create/verify approved email list**:
   - Go to your Supabase dashboard
   - Add each user's email to the `approved_emails` table in your database
   - Only emails in this table can sign in

2. **Set app session secret**:
   - `AUTH_SESSION_SECRET` must be a long random value
   - Recommended: at least 32 bytes of entropy

### How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable"
5. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL (get it from Supabase dashboard > Project Settings > API)
6. Add the second variable:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon key (get it from Supabase dashboard > Project Settings > API)
7. Add the third variable:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase service role key (Project Settings > API)
8. Add the fourth variable:
   - Name: `AUTH_SESSION_SECRET`
   - Value: A long random secret used to sign app session cookies

## Build Configuration

Railway should automatically detect Next.js and use:
- Build Command: `npm run build`
- Start Command: `npm start`

If not, set these manually in Railway:
- Build Command: `npm run build`
- Start Command: `npm start`

## Troubleshooting 500 Errors

### 1. Check Environment Variables
Make sure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `AUTH_SESSION_SECRET` are set in Railway.

### 2. Check Build Logs
Look at the Railway build logs to see if there are any build errors.

### 3. Check Runtime Logs
Check the Railway runtime logs for any error messages.

### 4. Common Issues

**Missing Environment Variables:**
- Error: `NEXT_PUBLIC_SUPABASE_URL is not defined`
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

- **Authentication Method**: Approved email lookup + signed app session cookie (7 days)

**⚠️ Important**: 
- Add each user's email to the `approved_emails` table—only approved emails can sign in
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `AUTH_SESSION_SECRET` set in Railway
