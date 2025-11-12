const SearchBar = ({ searchQuery, onSearchChange, placeholder = "Search..." }) => {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative">
        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-pos-text-muted text-sm">
          🔍
        </span>
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-pos-info transition-colors w-64"
        />
      </div>
      {/* {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="bg-pos-interactive-primary text-pos-text-muted border-none px-3 py-1.5 cursor-pointer text-sm transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white flex items-center gap-1"
          title="Reset search"
        >
          <span>✕</span> Reset
        </button>
      )} */}
    </div>
  );
};

export default SearchBar;
