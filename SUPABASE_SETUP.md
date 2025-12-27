# Supabase Database Setup Instructions

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **hayat-muslim** (or your project name)
3. Navigate to the **SQL Editor** section (icon looks like `</>` on the left sidebar)

## Step 2: Run the SQL Script

1. Click on **"New Query"**
2. Open the file `supabase-setup.sql` (in your project root)
3. Copy all the SQL commands
4. Paste them into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`

## Step 3: Verify Tables Were Created

1. Go to **"Table Editor"** in your Supabase Dashboard
2. You should see two new tables:
   - `memorized_surahs`
   - `memorized_ayahs`

## Step 4: Test the Application

1. Refresh your application
2. Try marking a surah as memorized
3. Check if the errors are gone

## What These Tables Do

### `memorized_surahs`
- Stores which complete surahs (chapters) you've memorized
- Columns:
  - `id`: Unique identifier
  - `user_id`: Links to your auth user
  - `surah_no`: Surah number (1-114)
  - `created_at`: When you marked it as memorized

### `memorized_ayahs`
- Stores individual ayahs (verses) you've memorized
- Columns:
  - `id`: Unique identifier
  - `user_id`: Links to your auth user
  - `surah_no`: Surah number
  - `ayah_no`: Ayah number within that surah
  - `created_at`: When you marked it as memorized

## Security (Row Level Security)

Both tables have RLS (Row Level Security) enabled, which means:
- You can only see your own memorized surahs/ayahs
- You can only insert/delete your own records
- Other users cannot see or modify your data

## Troubleshooting

### Memorized surahs showing for all users?
**This is a Row Level Security (RLS) issue!**

1. Go to Supabase SQL Editor
2. Run the SQL commands in `fix-rls.sql`
3. This will:
   - Enable RLS on the table
   - Create proper user isolation policies
   - Verify the policies are active

After running the fix:
- Each user will only see their own memorized surahs
- Existing data will be filtered by user_id
- New memorizations will be properly isolated

### Still getting 403 errors?
1. Make sure you're logged in (check Supabase Auth)
2. Verify the tables exist in Table Editor
3. Check that RLS policies are enabled
4. Verify your Supabase credentials in `src/app/services/supabase.ts`

### Tables already exist error?
- This is fine! The `IF NOT EXISTS` clause prevents errors if tables are already created

### Authentication error?
- You need to have Supabase Auth configured
- Make sure you have at least one user account
- The app will automatically filter data by the logged-in user's ID
