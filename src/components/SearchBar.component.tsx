import React, { ChangeEvent, useState, useEffect } from "react";
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search...",
}) => {
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onSearch]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onChange={handleChange}
      />
    </div>
  );
};

export default SearchBar;