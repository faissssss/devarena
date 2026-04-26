# Kaggle Date Handling

## Problem
The Kaggle CLI (`kaggle competitions list`) only provides:
- Competition reference (URL)
- Deadline (end date)
- Category, reward, team count

**Missing data:**
- Start date / enabled date
- Competition description
- Actual competition status

## Solution Implemented

### 1. Filter Past Competitions
Competitions with deadlines in the past are automatically filtered out during parsing. This ensures only active or upcoming competitions are shown.

**Before:** 20 competitions (including many from 2015-2023)
**After:** 4 active competitions (2026 deadlines only)

### 2. Estimate Start Dates
Since Kaggle CLI doesn't provide start dates, we estimate them based on typical Kaggle competition duration:

**Estimation Logic:**
- Calculate start date as **3 months before deadline**
- This matches typical Kaggle competition duration (2-3 months)
- Results in realistic competition timelines

**Example:**
- Deadline: November 9, 2026
- Estimated Start: August 9, 2026
- Duration: ~92 days

### 3. Handle Missing Deadlines
If a competition has no deadline:
- Start date: January 1 of current year
- End date: 1 hour after start (minimum duration from normalizeCompetition)

## Code Changes

### File: `backend/src/parsers/apiResponseParser.js`

```javascript
export function parseKaggleResponse(payload) {
  // ... parsing logic ...
  
  const now = new Date();
  
  return {
    competitions: items
      .map((item) => {
        const deadline = item.deadline || item.deadlineDate || item.endDate;
        const deadlineDate = deadline ? new Date(deadline) : null;
        
        // Skip past competitions
        if (deadlineDate && deadlineDate < now) {
          return null;
        }
        
        // Estimate start date (3 months before deadline)
        let estimatedStartDate;
        if (deadlineDate) {
          const threeMonthsBeforeDeadline = new Date(deadlineDate);
          threeMonthsBeforeDeadline.setMonth(threeMonthsBeforeDeadline.getMonth() - 3);
          estimatedStartDate = threeMonthsBeforeDeadline.toISOString();
        } else {
          estimatedStartDate = new Date(now.getFullYear(), 0, 1).toISOString();
        }
        
        return normalizeCompetition(item, {
          // ... other fields ...
          start_date: item.enabledDate || item.startDate || estimatedStartDate,
          end_date: deadline,
        });
      })
      .filter(Boolean); // Remove null entries
  };
}
```

## Limitations

### 1. Start Dates Are Estimates
- Not actual competition start dates
- Based on 3-month assumption
- May not match actual Kaggle competition launch dates

### 2. Past Competitions Excluded
- Historical competitions are filtered out
- Only shows active/upcoming competitions
- Cannot view competition history

### 3. No Competition Status
- Cannot distinguish between:
  - Active competitions (accepting submissions)
  - Upcoming competitions (not yet started)
  - Evaluation phase competitions (closed for submissions)

## Alternative Solutions (Not Implemented)

### Option 1: Kaggle API
- Requires different authentication method
- May provide more detailed data
- Current implementation returns 401 Unauthenticated

### Option 2: Web Scraping
- Scrape competition pages for accurate dates
- Complex and fragile (breaks with UI changes)
- May violate Kaggle Terms of Service
- Slow and resource-intensive

### Option 3: Manual Curation
- Manually maintain list of featured competitions
- Accurate but not scalable
- Requires regular updates

### Option 4: Accept CLI Limitations
- Show only deadline dates
- Don't display start dates for Kaggle competitions
- Most transparent approach

## Recommendations

### Current Implementation (Chosen)
✅ **Pros:**
- Filters out irrelevant past competitions
- Provides reasonable date estimates
- Works with existing Kaggle CLI
- No additional API calls or scraping

❌ **Cons:**
- Start dates are estimates, not actual
- May confuse users expecting exact dates

### Future Improvements
1. **Add disclaimer:** Show "Estimated start date" for Kaggle competitions
2. **Investigate Kaggle API:** Research proper authentication for official API
3. **User feedback:** Monitor if estimated dates cause confusion
4. **Competition status:** Add status field (Active/Upcoming/Closed) if data available

## Testing

### Test Script: `backend/scripts/resync-kaggle-only.js`
```bash
node backend/scripts/resync-kaggle-only.js
```

**Expected Results:**
- Only active competitions (future deadlines)
- Start dates ~3 months before deadline
- Durations ~90 days (3 months)

### Verification
```sql
SELECT title, start_date, end_date, 
       EXTRACT(DAY FROM (end_date - start_date)) as duration_days
FROM competitions 
WHERE platform = 'Kaggle'
ORDER BY end_date DESC;
```

## Related Files
- `backend/src/parsers/apiResponseParser.js` - Parser implementation
- `backend/src/services/dataSyncService.js` - Sync service using Kaggle CLI
- `backend/scripts/resync-kaggle-only.js` - Test script
- `backend/scripts/check-kaggle-dates.js` - Verification script
