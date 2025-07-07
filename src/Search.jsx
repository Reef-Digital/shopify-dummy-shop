import React, { useState, useEffect, useRef } from 'react';

const SearchAutocomplete = ({ apiEndpoint, debounceDelay = 300 }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimeout = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceDelay);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  const fetchSuggestions = async (q) => {
    try {
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();

      setLoading(true);
      const response = await fetch(`${apiEndpoint}?q=${encodeURIComponent(q)}`, {
        signal: controllerRef.current.signal,
      });

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      width: '100%',
      maxWidth: '500px',
      margin: '20px 0',
    },
    input: {
      width: '100%',
      padding: '10px',
      fontSize: '16px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      boxSizing: 'border-box',
    },
    loading: {
      fontSize: '14px',
      color: '#888',
      marginTop: '4px',
    },
    list: {
      margin: 0,
      padding: 0,
      listStyleType: 'none',
      border: '1px solid #ddd',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '200px',
      overflowY: 'auto',
    },
    item: {
      padding: '10px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
    },
    itemHover: {
      backgroundColor: '#f5f5f5',
    },
  };

  return (
    <div style={styles.container}>
      <input
        type="text"
        style={styles.input}
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div style={styles.loading}>Loading...</div>}
      {suggestions.length > 0 && (
        <ul style={styles.list}>
          {suggestions.map((item, index) => (
            <li
              key={index}
              style={styles.item}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              {typeof item === 'string' ? item : item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchAutocomplete;
