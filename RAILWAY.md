# Railway Deployment Guide

## Required Environment Variables

You **must** set these environment variables in Railway for the app to work:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

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

## Build Configuration

Railway should automatically detect Next.js and use:
- Build Command: `npm run build`
- Start Command: `npm start`

If not, set these manually in Railway:
- Build Command: `npm run build`
- Start Command: `npm start`

## Troubleshooting 500 Errors

### 1. Check Environment Variables
Make sure both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Railway.

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
- Verify the URL and anon key are correct

**Build Failures:**
- Check that Node.js version is 18+ (Railway should auto-detect)
- Ensure all dependencies install correctly

## Port Configuration

Railway automatically sets the `PORT` environment variable. Next.js will use this automatically, so no configuration needed.

## Health Check

The app should respond at the root URL `/` after successful deployment.

