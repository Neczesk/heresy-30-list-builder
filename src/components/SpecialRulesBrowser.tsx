import React, { useState, useMemo } from 'react';
import { Button } from './ui';
import { DataLoader } from '../utils/dataLoader';
import styles from './SpecialRulesBrowser.module.css';

interface SpecialRulesBrowserProps {
  onBackToBrowserMenu: () => void;
}

const SpecialRulesBrowser: React.FC<SpecialRulesBrowserProps> = ({
  onBackToBrowserMenu
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const specialRules = useMemo(() => {
    const allRules = DataLoader.getSpecialRules();
    // Filter out wargear rules, only show actual special rules
    return allRules.filter(rule => rule.type === 'special-rule');
  }, []);

  const filteredRules = useMemo(() => {
    if (!searchTerm) return specialRules;
    
    const searchLower = searchTerm.toLowerCase();
    return specialRules.filter(rule => 
      rule.name.toLowerCase().includes(searchLower) ||
      rule.shortText.toLowerCase().includes(searchLower) ||
      rule.description.toLowerCase().includes(searchLower) ||
      rule.longText.toLowerCase().includes(searchLower)
    );
  }, [specialRules, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRuleToggle = (ruleId: string) => {
    const newExpandedRules = new Set(expandedRules);
    if (newExpandedRules.has(ruleId)) {
      newExpandedRules.delete(ruleId);
    } else {
      newExpandedRules.add(ruleId);
    }
    setExpandedRules(newExpandedRules);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className={styles['special-rules-browser']}>
      <div className={styles['browser-header']}>
        <Button variant="secondary" onClick={onBackToBrowserMenu}>
          ← Back to Browser Menu
        </Button>
        <h2>Special Rules Browser</h2>
      </div>

      <div className={styles['search-section']}>
        <div className={styles['search-container']}>
          <div className={styles['search-input-wrapper']}>
            <input
              type="text"
              placeholder="Search special rules..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles['search-input']}
            />
            {searchTerm && (
              <Button variant="secondary" size="sm" onClick={clearSearch}>
                ×
              </Button>
            )}
          </div>
          <div className={styles['search-results']}>
            {searchTerm && (
              <span className={styles['results-count']}>
                {filteredRules.length} of {specialRules.length} rules found
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles['rules-section']}>
        {filteredRules.length === 0 ? (
          <div className={styles['no-results']}>
            <p>No special rules found matching "{searchTerm}"</p>
            <Button variant="info" size="sm" onClick={clearSearch}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className={styles['rules-list']}>
            {filteredRules.map((rule) => (
              <div key={rule.id} className={styles['rule-item']}>
                <div 
                  className={styles['rule-header']}
                  onClick={() => handleRuleToggle(rule.id)}
                >
                  <div className={styles['rule-title']}>
                    <h3>{rule.name}</h3>
                    <div className={styles['rule-short-text']}>
                      <strong>{rule.shortText}</strong>
                    </div>
                  </div>
                  <div className={styles['rule-toggle']}>
                    {expandedRules.has(rule.id) ? '−' : '+'}
                  </div>
                </div>
                
                {expandedRules.has(rule.id) && (
                  <div className={styles['rule-details']}>
                    <div className={styles['rule-description']}>
                      <em>{rule.description}</em>
                    </div>
                    <div className={styles['rule-long-text']}>
                      {rule.longText}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialRulesBrowser; 