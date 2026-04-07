# Database Seed Documentation

This document explains how to use the database seed script to populate your database with test data for the Teams feature.

## Quick Start

```bash
# First time - seed the database
pnpm db:seed

# Re-seed (clear + seed)
pnpm db:reseed

# Just clear seed data
pnpm db:clear
```

**Login Credentials**: Any email ending in `@compesn.com` with password `password123`

## What Gets Seeded

The seed script creates comprehensive test data including:

### 1. Users (12 players + 1 coach)
- **ProPlayer1** (player1@compesn.com) - Titans owner, Top laner
- **MidLaneKing** (midlane@compesn.com) - Phoenix owner, Mid laner
- **JungleMain** (jungle@compesn.com) - Jungle main
- **ADCCarry** (adc@compesn.com) - ADC main
- **SupportGod** (support@compesn.com) - Support main
- **TopLaner99** (top@compesn.com) - Dragon Slayers owner (EUW)
- **EliteSupport** (elite@compesn.com) - Support main (EUW)
- **MidOrFeed** (mid2@compesn.com) - Mid laner (EUW)
- **JungleDiff** (jungle2@compesn.com) - Lightning Strikes owner (KR)
- **BotLaneGG** (bot@compesn.com) - Bot laner (KR)
- **FlexPlayer** (flex@compesn.com) - Casual Squad owner
- **ProCoach** (coach@compesn.com) - Team coach

All users have the password: `password123`

### 2. Teams (5 teams)
- **Titans Esports (TTE)** - NA, Diamond, Competitive, Full roster + coach
- **Phoenix Gaming (PHX)** - NA, Platinum, Regular, Partial roster
- **Dragon Slayers (DRS)** - EUW, Master, Hardcore, Partial roster
- **Lightning Strikes (LS)** - KR, Grandmaster, Hardcore, Partial roster
- **Casual Squad (CSQ)** - NA, Gold, Casual, Owner only

### 3. Team Members (16 members)
- Multiple players assigned to different teams with various roles (TOP, JUNGLE, MID, BOT, SUPPORT, SUB, COACH)
- Each member has a join date (ranging from 30-120 days ago)

### 4. Scrims (8 matches)

#### Completed Scrims (5):
1. **Titans vs Phoenix** (7 days ago) - Titans won, 35 min
2. **Titans vs Dragons** (14 days ago) - Dragons won, 42 min, Bo3
3. **Phoenix vs Titans** (21 days ago) - Titans won, 28 min
4. **Dragons vs Lightning** (30 days ago) - Lightning won, 38 min
5. **Titans vs Phoenix** (35 days ago) - Phoenix won, 31 min

#### Upcoming/Open Scrims (3):
1. **Titans vs Dragons** (in 2 days) - Weekend Tournament Prep, Bo3
2. **Phoenix Gaming** (in 5 days) - Open scrim, looking for Platinum+ team
3. **Lightning Strikes** (in 7 days) - High Elo Bo5 Practice, Master+ only

### 5. Scrim Participants (50 player performances)
- Complete stats for all 5 completed scrims
- Each player has realistic performance data:
  - Kills, Deaths, Assists (KDA)
  - CS (Creep Score) and CS@10
  - Gold Earned
  - Vision Score
  - Damage Dealt and Taken
  - Champion played
  - Role

### 6. Scrim Drafts (3 complete drafts)
- Full pick/ban phase for completed scrims
- Blue and Red side picks and bans
- Team rosters with player PUUIDs
- Real champion IDs from League of Legends

### 7. Team Invites (4 invites)
- 3 Pending invites
- 1 Accepted invite
- Various roles and teams

## How to Run the Seed Script

### Prerequisites
Make sure you have:
1. A PostgreSQL database running
2. Valid `DATABASE_URL` in your `.env` file
3. All migrations run (the database schema should be up to date)

### Running the Seed

```bash
# Seed the database (first time only)
pnpm db:seed

# Clear existing seed data
pnpm db:clear

# Clear and re-seed in one command (recommended for subsequent runs)
pnpm db:reseed

# Or using npm
npm run db:seed
npm run db:clear
npm run db:reseed

# Or using yarn
yarn db:seed
yarn db:clear
yarn db:reseed
```

**Note**: If you get a "duplicate key" error when running `pnpm db:seed`, use `pnpm db:reseed` instead to clear existing data first.

### Expected Output

When successful, you'll see output like:

```
🌱 Starting database seed...
Creating users...
✅ Created 12 users
Creating teams...
✅ Created 5 teams
Creating team members...
✅ Created 16 team members
Creating scrims...
✅ Created 8 scrims
Creating scrim participants...
✅ Created 50 scrim participants
Creating scrim drafts...
✅ Created 3 scrim drafts
Creating team invites...
✅ Created 4 team invites

🎉 Database seeding completed successfully!

📊 Summary:
   - 12 users
   - 5 teams
   - 16 team members
   - 8 scrims (5 completed, 3 upcoming)
   - 50 scrim participants
   - 3 scrim drafts
   - 4 team invites

🔐 Test Credentials:
   Email: player1@compesn.com (or any other player email)
   Password: password123
```

## Testing the Teams Feature

After seeding, you can:

1. **Login** with any of the test accounts (password: `password123`)
2. **View Teams** - Navigate to `/teams` to see all teams
3. **Team Details** - Click on a team to see:
   - Team roster with players and roles
   - Team stats (aggregated from scrims)
   - Match history (completed scrims)
   - Draft history
4. **Player Stats** - View individual player statistics
5. **Scrim Queue** - See upcoming scrims and open scrim requests
6. **Team Management** - If logged in as a team owner:
   - Manage roster
   - Send/accept invites
   - Create scrims

## Recommended Test Accounts

### For Team Owner Features:
- **player1@compesn.com** - Owner of Titans Esports (full roster)
- **midlane@compesn.com** - Owner of Phoenix Gaming (partial roster)
- **top@compesn.com** - Owner of Dragon Slayers (EUW team)
- **jungle2@compesn.com** - Owner of Lightning Strikes (KR team)
- **flex@compesn.com** - Owner of Casual Squad (solo owner)

### For Team Member Features:
- **jungle@compesn.com** - Member of multiple teams
- **adc@compesn.com** - ADC with good stats
- **support@compesn.com** - Support player

### For Coach Features:
- **coach@compesn.com** - Coach of Titans Esports

## Data Relationships

The seed creates realistic data relationships:

1. **Users ↔ Teams**: Multiple users can be on multiple teams (via teamMembers)
2. **Teams ↔ Scrims**: Teams play against each other in scrims
3. **Users ↔ Scrim Participants**: Players have performance stats for each scrim
4. **Scrims ↔ Scrim Drafts**: Each completed scrim has a draft phase
5. **Teams ↔ Team Invites**: Teams can invite players with pending/accepted status

## Clearing the Database

### Easy Method (Recommended)

Use the provided script to clear just the seed data:

```bash
# Clear seed data only
pnpm db:clear

# Or clear and re-seed in one command
pnpm db:reseed
```

### Manual Method

If you want to manually clear the data:

```sql
-- Connect to your database and run:
DELETE FROM scrim_participants;
DELETE FROM scrim_drafts;
DELETE FROM scrims;
DELETE FROM team_invites;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM users WHERE email LIKE '%@compesn.com';
```

### Nuclear Option

Reset the entire database (use with caution - this will delete ALL data):

```bash
# Drop and recreate all tables
pnpm drizzle-kit push
```

## Customizing the Seed

The seed file is located at `src/lib/database/seed.ts`. You can modify it to:

- Add more users, teams, or scrims
- Adjust team ranks and activity levels
- Change player stats to test edge cases
- Add more team invites or roster changes
- Modify draft picks and bans

## Troubleshooting

### Error: Connection refused
- Make sure your PostgreSQL database is running
- Check that `DATABASE_URL` in `.env` is correct

### Error: relation does not exist
- Run migrations first: `pnpm drizzle-kit push` or `pnpm drizzle-kit migrate`

### Error: duplicate key value violates unique constraint
- The seed data already exists. Run `pnpm db:reseed` to clear and re-seed, or `pnpm db:clear` to just clear

### Error: ECONNREFUSED
- Check if your database is accepting connections
- Verify firewall settings and database host/port

## Notes

- All timestamps are relative to the current date/time
- Champion IDs match Riot Games' official champion IDs
- PUUIDs are fake but follow the correct format
- Stats are randomized but realistic (KDA ratios, CS numbers, etc.)
- Winners have slightly better stats than losers

