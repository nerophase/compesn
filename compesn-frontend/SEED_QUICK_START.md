# Database Seed - Quick Start Guide

## Commands

```bash
# Seed database (first time)
pnpm db:seed

# Clear existing seed data
pnpm db:clear

# Clear + Re-seed (recommended)
pnpm db:reseed
```

## Test Accounts

All passwords: `password123`

| Email               | Role   | Team              | Description           |
| ------------------- | ------ | ----------------- | --------------------- |
| player1@compesn.com | Owner  | Titans Esports    | Full roster team (NA) |
| midlane@compesn.com | Owner  | Phoenix Gaming    | Partial roster (NA)   |
| top@compesn.com     | Owner  | Dragon Slayers    | Master tier (EUW)     |
| jungle2@compesn.com | Owner  | Lightning Strikes | Grandmaster (KR)      |
| flex@compesn.com    | Owner  | Casual Squad      | Solo owner (NA)       |
| jungle@compesn.com  | Player | Multiple teams    | Multi-team player     |
| adc@compesn.com     | Player | Titans            | ADC main              |
| support@compesn.com | Player | Titans            | Support main          |
| coach@compesn.com   | Coach  | Titans            | Team coach            |

## What's Available

### ✅ Teams (5 total)

- **Titans Esports (TTE)** - NA, Diamond, 6 members
- **Phoenix Gaming (PHX)** - NA, Platinum, 3 members
- **Dragon Slayers (DRS)** - EUW, Master, 3 members
- **Lightning Strikes (LS)** - KR, Grandmaster, 2 members
- **Casual Squad (CSQ)** - NA, Gold, 1 member

### ✅ Scrims

- **5 Completed** (with full stats, drafts, and player performance)
- **3 Upcoming** (scheduled matches, some open for others to join)

### ✅ Stats Available

- Individual player KDA, CS, damage, vision
- Team win/loss records
- Draft history with picks/bans
- Champion performance data
- Role-specific statistics

## Testing Checklist

- [ ] Login with test account
- [ ] View teams list at `/teams`
- [ ] Click on a team to see details
- [ ] View team roster and member roles
- [ ] Check team match history
- [ ] View draft history
- [ ] See individual player stats
- [ ] Check upcoming scrims
- [ ] Test team owner features (manage roster, create scrims)
- [ ] View scrim queue
- [ ] Test team invites (pending/accepted)

## Common Issues

**Duplicate key error?**
→ Run `pnpm db:reseed` instead of `pnpm db:seed`

**Connection refused?**
→ Check your `DATABASE_URL` in `.env` file

**Data not showing?**
→ Verify frontend routes match: `/teams`, `/scrims`, etc.

## Full Documentation

See [DATABASE_SEED_README.md](./DATABASE_SEED_README.md) for complete documentation.
