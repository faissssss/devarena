import { useEffect, useRef, useState } from 'react';
import { formatPlatformName } from '../utils/platformFormatter';

/**
 * PlatformMultiSelect Component
 * Multi-select dropdown with checkboxes for filtering by platform
 * 
 * @param {Object} props
 * @param {string[]} props.selectedPlatforms - Array of selected platform names (raw)
 * @param {Function} props.onSelectionChange - Callback when selection changes
 * @param {string[]} props.availablePlatforms - List of available platforms (optional, will fetch if not provided)
 */
export default function PlatformMultiSelect({
  selectedPlatforms = [],
  onSelectionChange = () => {},
  availablePlatforms = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [platforms, setPlatforms] = useState(availablePlatforms || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(!availablePlatforms);
  const dropdownRef = useRef(null);

  // Fetch available platforms if not provided
  useEffect(() => {
    if (availablePlatforms) {
      // Sort platforms alphabetically by their formatted display names
      const sorted = [...availablePlatforms].sort((a, b) => {
        const nameA = formatPlatformName(a).toLowerCase();
        const nameB = formatPlatformName(b).toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setPlatforms(sorted);
      setLoading(false);
      return;
    }

    async function fetchPlatforms() {
      try {
        const response = await fetch('/api/competitions/platforms');
        const data = await response.json();
        // Sort platforms alphabetically by their formatted display names
        const sorted = (data.platforms || []).sort((a, b) => {
          const nameA = formatPlatformName(a).toLowerCase();
          const nameB = formatPlatformName(b).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setPlatforms(sorted);
      } catch (error) {
        console.error('Failed to fetch platforms:', error);
        setPlatforms([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPlatforms();
  }, [availablePlatforms]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredPlatforms = platforms.filter((platform) =>
    formatPlatformName(platform).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePlatform = (platform) => {
    const newSelection = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredPlatforms);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const selectedCount = selectedPlatforms.length;
  const buttonText = selectedCount === 0
    ? 'All platforms'
    : selectedCount === 1
    ? formatPlatformName(selectedPlatforms[0])
    : `${selectedCount} platforms`;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input flex items-center justify-between w-full"
        style={{
          cursor: 'pointer',
          paddingRight: '10px',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{buttonText}</span>
        {selectedCount > 0 && (
          <span
            className="ml-2 flex-shrink-0 inline-flex items-center justify-center bg-[#f54e00] text-white rounded-full"
            style={{
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              fontSize: '0.6875rem',
              fontWeight: 600,
            }}
          >
            {selectedCount}
          </span>
        )}
        <svg
          className={`ml-2 flex-shrink-0 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            marginTop: 8,
            width: '100%',
            background: 'var(--surface-200)',
            border: '1px solid var(--border-primary)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-card)',
            maxHeight: 400,
            display: 'flex',
            flexDirection: 'column',
          }}
          role="listbox"
        >
          {/* Search input */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--border-primary)' }}>
            <input
              type="search"
              placeholder="Search platforms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{
                width: '100%',
                fontSize: '0.875rem',
                padding: '8px 12px',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid var(--border-primary)' }}>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={filteredPlatforms.length === 0}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.75rem',
                opacity: filteredPlatforms.length === 0 ? 0.5 : 1,
                cursor: filteredPlatforms.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selectedCount === 0}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.75rem',
                color: 'var(--color-error)',
                background: 'transparent',
                border: '1px solid rgba(207,45,86,0.2)',
                borderRadius: 6,
                cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedCount === 0 ? 0.5 : 1,
                transition: 'background-color 150ms ease',
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (selectedCount > 0) {
                  e.currentTarget.style.background = 'rgba(207,45,86,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Clear All
            </button>
          </div>

          {/* Platform list */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 280 }}>
            {loading ? (
              <div style={{ 
                padding: 16, 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-ui)',
              }}>
                Loading platforms...
              </div>
            ) : filteredPlatforms.length === 0 ? (
              <div style={{ 
                padding: 16, 
                textAlign: 'center', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-ui)',
              }}>
                {searchQuery ? 'No platforms found' : 'No platforms available'}
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {filteredPlatforms.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  const displayName = formatPlatformName(platform);
                  return (
                    <label
                      key={platform}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-300)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTogglePlatform(platform)}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: '1px solid var(--border-medium)',
                          accentColor: 'var(--color-accent)',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--color-dark)', 
                        flex: 1,
                        fontFamily: 'var(--font-ui)',
                      }}>
                        {displayName}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
