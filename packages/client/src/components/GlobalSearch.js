import React, { useState, useEffect } from "react";

const SearchFilter = ({ data = [], keys = [], onFilter, placeholder = "Search..." }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      onFilter(data);
      return;
    }

    const filtered = data.filter((item) =>
      keys.some((key) => {
        const value = item[key];
        return value && value.toString().toLowerCase().includes(query.toLowerCase());
      })
    );

    onFilter(filtered);
  }, [query, data]);

  return (
    <div className="flex items-center gap-2 border border-pos-border-secondary rounded-md bg-pos-bg-tertiary px-3 py-2 w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent focus:outline-none text-pos-text-primary"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          className="text-pos-text-muted hover:text-pos-text-primary text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchFilter;
