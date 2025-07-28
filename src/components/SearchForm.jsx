import { useState, useEffect, useRef } from 'react';
import { getSearchApiUrl } from '../config/api';

const SearchForm = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef(null);

  // Debounce effect for input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Search effect
  useEffect(() => {
    if (debouncedQuery.trim() && debouncedQuery.trim().split(/\s+/).length > 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  // Focus input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // API handler for search
  const callSearchApi = async (searchQuery) => {
    setIsLoading(true);
    try {
      const apiUrl = getSearchApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: {
            type: 'search',
            value: searchQuery
          }
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data || [];
      } else {
        console.error('API response error:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Perform full search
  const performSearch = async (searchQuery) => {
    const searchResults = await callSearchApi(searchQuery);
    setResults(searchResults);
  };

  // Handle Enter key for search
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (query.trim().split(/\s+/).length > 2) {
        performSearch(query);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Products</h1>
          <p className="text-gray-600">Find the products you're looking for</p>
        </div>

        {/* Search Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search for products..."
              className="w-full px-4 py-4 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {!query && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg">Start typing to search for products</p>
              <p className="text-sm mt-2">Enter at least 3 words to get results</p>
            </div>
          )}
          
          {query && !isLoading && results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6" />
              </svg>
              <p className="text-lg">No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check your spelling</p>
            </div>
          )}
          
          {results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
              </h3>
              <div className="space-y-4">
                {results.map((result, index) => {
                  if (result.type === 'text') {
                    return (
                      <div key={index} className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-3 flex-1">
                            <h4 className="text-sm font-medium text-blue-800 mb-1">Recommendation</h4>
                            <p className="text-blue-700 leading-relaxed">
                              {result.value}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={index} className={`p-6 border border-gray-200 rounded-lg transition-colors ${
                      result.product?.productUrl 
                        ? 'hover:bg-gray-50 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                            {result.title}
                          </h4>
                          <p className="text-gray-600 mb-3 leading-relaxed">
                            {result.reason}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              Product ID: {result.productId}
                            </span>
                            <span className="text-sm text-gray-500">
                              Score: {(result.score * 100).toFixed(1)}%
                            </span>
                            {!result.product?.productUrl && (
                              <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-6">
                          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                            {result.type}
                          </span>
                        </div>
                      </div>
                      {result.product?.productUrl && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <a 
                            href={result.product.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Product
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchForm; 