import { useState } from 'react';

/**
 * DatePicker Component
 * Calendar UI for selecting single dates or date ranges for filtering
 * 
 * @param {Object} props
 * @param {'single'|'range'} props.mode - Selection mode (default: 'range')
 * @param {Date|null} props.selectedDate - Selected date for single mode
 * @param {{startDate: Date|null, endDate: Date|null}} props.selectedRange - Selected range for range mode
 * @param {Function} props.onDateSelect - Callback for single date selection
 * @param {Function} props.onRangeSelect - Callback for range selection
 * @param {Date} props.minDate - Earliest selectable date (optional)
 * @param {Date} props.maxDate - Latest selectable date (optional)
 */
export default function DatePicker({
  mode = 'range',
  selectedDate = null,
  selectedRange = { startDate: null, endDate: null },
  onDateSelect = () => {},
  onRangeSelect = () => {},
  minDate = null,
  maxDate = null,
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isDateDisabled = (date) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isDateInRange = (date) => {
    if (!date || mode !== 'range') return false;
    const { startDate, endDate } = selectedRange;
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateInHoverRange = (date) => {
    if (!date || mode !== 'range' || !tempStartDate || !hoverDate) return false;
    const start = tempStartDate < hoverDate ? tempStartDate : hoverDate;
    const end = tempStartDate < hoverDate ? hoverDate : tempStartDate;
    return date >= start && date <= end;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;

    if (mode === 'single') {
      onDateSelect(date);
    } else {
      // Range mode
      if (!tempStartDate) {
        // First click: set start date
        setTempStartDate(date);
      } else {
        // Second click: set end date and complete range
        const start = tempStartDate < date ? tempStartDate : date;
        const end = tempStartDate < date ? date : tempStartDate;
        onRangeSelect(start, end);
        setTempStartDate(null);
        setHoverDate(null);
      }
    }
  };

  const handleQuickSelect = (type) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (type) {
      case 'today':
        if (mode === 'single') {
          onDateSelect(today);
        } else {
          onRangeSelect(today, today);
        }
        break;
      case 'next7':
        const next7 = new Date(today);
        next7.setDate(today.getDate() + 7);
        onRangeSelect(today, next7);
        break;
      case 'next30':
        const next30 = new Date(today);
        next30.setDate(today.getDate() + 30);
        onRangeSelect(today, next30);
        break;
      case 'clear':
        if (mode === 'single') {
          onDateSelect(null);
        } else {
          onRangeSelect(null, null);
        }
        setTempStartDate(null);
        setHoverDate(null);
        break;
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div 
      style={{
        background: 'var(--popover)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
        boxShadow: 'none',
      }}
    >
      {/* Header with month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={() => navigateMonth(-1)}
          style={{
            padding: 8,
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          aria-label="Previous month"
        >
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 style={{ 
          color: 'var(--foreground)', 
          fontFamily: 'var(--font-ui)', 
          fontSize: '0.9375rem',
          fontWeight: 500,
          margin: 0,
        }}>
          {monthName}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          style={{
            padding: 8,
            background: 'transparent',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            color: 'var(--muted-foreground)',
            transition: 'background-color 150ms ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          aria-label="Next month"
        >
          <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div 
            key={day} 
            style={{ 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              color: 'var(--muted-foreground)', 
              fontWeight: 500, 
              padding: '4px 0',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1', minHeight: 32 }} />;
          }

          const isDisabled = isDateDisabled(date);
          const isToday = isSameDay(date, today);
          const isSelected =
            mode === 'single'
              ? isSameDay(date, selectedDate)
              : isSameDay(date, selectedRange.startDate) || isSameDay(date, selectedRange.endDate);
          const inRange = isDateInRange(date);
          const inHoverRange = isDateInHoverRange(date);

          let buttonStyle = {
            aspectRatio: '1',
            minHeight: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius)',
            transition: 'all 150ms ease',
            border: 'none',
            fontFamily: 'var(--font-ui)',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          };

          if (isDisabled) {
            buttonStyle.color = 'var(--muted-foreground)';
            buttonStyle.background = 'transparent';
          } else if (isSelected) {
            buttonStyle.background = 'var(--primary)';
            buttonStyle.color = 'var(--primary-foreground)';
            buttonStyle.fontWeight = 500;
          } else if (inRange) {
            buttonStyle.background = 'var(--muted)';
            buttonStyle.color = 'var(--foreground)';
          } else if (inHoverRange) {
            buttonStyle.background = 'var(--muted)';
            buttonStyle.color = 'var(--foreground)';
          } else {
            buttonStyle.background = 'transparent';
            buttonStyle.color = 'var(--foreground)';
          }

          if (isToday && !isSelected) {
            buttonStyle.border = '1px solid var(--primary)';
          }

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => {
                if (mode === 'range' && tempStartDate) setHoverDate(date);
                if (!isDisabled && !isSelected && !inRange && !inHoverRange) {
                  event.currentTarget.style.background = 'var(--accent)';
                }
              }}
              onMouseLeave={() => {
                setHoverDate(null);
                if (!isDisabled && !isSelected && !inRange && !inHoverRange) {
                  event.currentTarget.style.background = 'transparent';
                }
              }}
              disabled={isDisabled}
              style={buttonStyle}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Quick select buttons */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 8, 
        paddingTop: 12, 
        borderTop: '1px solid var(--border)' 
      }}>
        <button
          onClick={() => handleQuickSelect('today')}
          className="btn btn-primary"
          style={{ padding: '4px 12px', fontSize: '0.875rem' }}
        >
          Today
        </button>
        {mode === 'range' && (
          <>
            <button
              onClick={() => handleQuickSelect('next7')}
              className="btn btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.875rem' }}
            >
              Next 7 days
            </button>
            <button
              onClick={() => handleQuickSelect('next30')}
              className="btn btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.875rem' }}
            >
              Next 30 days
            </button>
          </>
        )}
        <button
          onClick={() => handleQuickSelect('clear')}
          style={{
            padding: '4px 12px',
            fontSize: '0.875rem',
            color: 'var(--destructive)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            transition: 'background-color 150ms ease',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--muted)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
