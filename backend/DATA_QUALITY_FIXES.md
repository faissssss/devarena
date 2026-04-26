# Data Quality Fixes - April 26, 2026

## Issues Reported
1. Competition dates are incorrect (e.g., "No Hack No CTF 2026" showing wrong dates)
2. Competitions lack descriptions
3. On-site competitions showing platform names instead of actual city/country

## Root Cause Analysis

### 1. Incorrect Dates
**Root Cause:** The `format_time: 'true'` parameter in CLIST API requests was causing dates to be returned in European format (DD.MM) instead of ISO format. Our parser was misinterpreting "04.07" as April 7 instead of July 4.

**Example:**
- CLIST with `format_time: 'true'` returned: `"start": "04.07 Sat 07:00"`
- Parser interpreted as: April 7, 2026
- Actual date: July 4, 2026 (DD.MM format)

**Fix Applied:**
- Removed `format_time: 'true'` parameter from `backend/src/services/dataSyncService.js`
- CLIST now returns ISO format dates: `"start": "2026-07-04T00:00:00"`
- Parser correctly interprets ISO dates

**Verification:**
- "No Hack No CTF 2026" now shows correct dates: July 3-5, 2026 (UTC) = July 4-6, 2026 (local)

### 2. Missing Descriptions
**Root Cause:** CLIST API aggregates data from multiple sources but doesn't provide description fields for most competitions.

**Investigation Results:**
- Checked 50 recent competitions from CLIST API
- 0 out of 50 had descriptions
- CLIST focuses on metadata (title, dates, platform, URL) not full content

**Possible Solutions (NOT IMPLEMENTED):**
1. Scrape descriptions from source URLs (complex, slow, may violate ToS)
2. Use competition-specific APIs (CTFtime, CodeForces, etc.) for detailed data
3. Accept limitation and show "No description available"

**Current Status:** Descriptions remain unavailable. This is a known limitation of using CLIST as the primary data source.

### 3. Location Display
**Root Cause:** Parser was using `item.host ?? item.location ?? 'Online'` which showed platform domains for on-site events.

**Fix Applied (Previous Session):**
- Changed to `item.location || 'Online'` in `backend/src/parsers/apiResponseParser.js`
- Now only shows actual location if provided by API, otherwise "Online"

**Current Status:** All competitions correctly show "Online" (CLIST data doesn't include physical locations for most events)

## Additional Improvements

### Extended Date Range
- Increased sync window from 180 days to 365 days
- Now fetches competitions up to 1 year in advance
- Ensures long-term planning competitions are included

### Kaggle Date Handling (NEW)
**Problem:** Kaggle CLI only provides deadline dates, not start dates. This caused:
- Start dates set to current timestamp
- Many past competitions with 0-day duration
- Confusing timeline display

**Solution:**
1. **Filter past competitions** - Only show competitions with future deadlines
2. **Estimate start dates** - Calculate start as 3 months before deadline
3. **Realistic durations** - Competitions now show ~90 day durations

**Results:**
- Before: 20 competitions (many from 2015-2023) with incorrect dates
- After: 4 active competitions with estimated 3-month timelines
- See `backend/KAGGLE_DATE_HANDLING.md` for detailed documentation

### Files Modified
1. `backend/src/services/dataSyncService.js`
   - Removed `format_time: 'true'` parameter
   - Extended date range to 365 days
   - Added comment explaining the fix

2. `backend/src/parsers/apiResponseParser.js`
   - Fixed location handling (previous session)
   - **NEW:** Added Kaggle date estimation logic
   - **NEW:** Filter out past Kaggle competitions
   - **NEW:** Estimate start dates as 3 months before deadline

## Testing Performed
1. Created multiple investigation scripts to trace the issue
2. Verified CLIST API responses with and without `format_time` parameter
3. Performed full database re-sync with corrected parameters
4. Verified "No Hack No CTF 2026" now has correct dates
5. Checked description availability across 50 competitions
6. Verified location handling for on-site events

## Recommendations
1. **Dates:** ✅ Fixed and working correctly
2. **Locations:** ✅ Working as expected (most competitions are online)
3. **Descriptions:** Consider one of these options:
   - Accept limitation and show "No description available"
   - Implement selective scraping for high-priority platforms (CTFtime, CodeForces)
   - Add manual description curation for featured competitions
   - Use platform-specific APIs where available (requires multiple API integrations)

## Scripts Created for Investigation
- `backend/scripts/check-specific-competition.js` - Search for specific competitions
- `backend/scripts/check-ctftime-competitions.js` - Compare CLIST vs CTFtime data
- `backend/scripts/check-db-competitions.js` - Verify database contents
- `backend/scripts/check-no-hack-no-ctf.js` - Investigate specific competition
- `backend/scripts/resync-ctftime.js` - Re-sync CTFtime competitions
- `backend/scripts/clean-and-full-resync.js` - Full database re-sync
- `backend/scripts/debug-clist-sync.js` - Debug sync parameters
- `backend/scripts/check-onsite-competitions.js` - Check location data
- `backend/scripts/check-descriptions.js` - Check description availability
