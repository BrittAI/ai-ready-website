# Railway Deployment Guide

This guide walks you through deploying the AI Readiness Website to Railway with a PostgreSQL database.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI installed (optional but recommended)
- This repository cloned locally

## Deployment Steps

### 1. Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" 
3. Choose "Add PostgreSQL"
4. Railway will automatically provision a PostgreSQL database with a `DATABASE_URL`

### 3. Configure Environment Variables

Railway will automatically set `DATABASE_URL` from the PostgreSQL service. Add these additional variables:

1. Click on your application service
2. Go to "Variables" tab
3. Add the following:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `FIRECRAWL_API_KEY`: Your Firecrawl API key
   - `NODE_ENV`: Set to `production`

### 4. Deploy

Railway will automatically deploy your application when you:
- Push to your connected GitHub repository
- Or manually trigger a deployment from the Railway dashboard

### 5. Initialize Database (First Time Only)

After the first deployment, the database tables will be automatically created when the application starts.

If you need to manually run migrations:

```bash
# Using Railway CLI
railway run node scripts/setup-postgres.js

# Or connect to Railway's PostgreSQL and run migrations manually
```

## Database Configuration

The application automatically detects and uses PostgreSQL when `DATABASE_URL` is set. Otherwise, it falls back to SQLite for local development.

### Database Schema

The PostgreSQL database includes:
- `reports` - Stores AI readiness analysis results
- `branding` - White-label configuration
- `leads` - Lead capture information
- `analytics` - Usage analytics and events

### Backup and Restore

To backup your Railway PostgreSQL database:

```bash
# Get connection string from Railway dashboard
railway variables | grep DATABASE_URL

# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

## Monitoring

- View logs: Railway Dashboard → Your Service → Logs
- Database metrics: Railway Dashboard → PostgreSQL Service → Metrics
- Application metrics: Railway Dashboard → Your Service → Metrics

## Troubleshooting

### Package Manager Issues

If you see lockfile errors during deployment:
- Railway automatically detects and uses pnpm based on the `pnpm-lock.yaml` file
- The `railway.json` configuration handles the `--no-frozen-lockfile` flag automatically
- If issues persist, try deleting and regenerating the lockfile locally

### Database Connection Issues

If you see database connection errors:
1. Verify `DATABASE_URL` is set correctly in Railway variables
2. Check PostgreSQL service is running in Railway dashboard
3. Ensure SSL is configured correctly (handled automatically in production)

### Migration Issues

If tables aren't created:
1. Check application logs for initialization errors
2. Run manual migration: `railway run node scripts/setup-postgres.js`
3. Verify PostgreSQL service has sufficient permissions

### Performance

For better performance with PostgreSQL:
- The connection pool is configured with 20 connections max
- Indexes are automatically created on frequently queried columns
- Consider adding read replicas for high traffic

## Local Development

For local development with PostgreSQL:

1. Install PostgreSQL locally
2. Create a database: `createdb ai_readiness_dev`
3. Set `DATABASE_URL` in `.env.local`:
   ```
   DATABASE_URL=postgresql://localhost:5432/ai_readiness_dev
   ```
4. Run migrations: `node scripts/setup-postgres.js`

## Costs

Railway charges for:
- Application usage (CPU, Memory, Network)
- PostgreSQL database (Storage, Compute)
- Check current pricing at [railway.app/pricing](https://railway.app/pricing)

## Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- GitHub Issues: Create an issue in this repository