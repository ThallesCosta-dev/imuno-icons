import React, { useState } from "react";
import SearchBar from "../SearchBar.component";
import "./SideBar.component.css";
import itemsList from "../../assets/itemList.json";
import Icon from "../Icon.component";
// Define a blank structure for items

interface SideBarProps {
  onItemClick: (objId: string) => void; // Prop to handle the search and update parent state
}

const SideBar: React.FC<SideBarProps> = ({ onItemClick }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Handle input change
  const handleSearch = (searchTerm: string): void => {
    setSearchTerm(searchTerm); // Set the search term directly
  };

  // Filter items based on the search term
  const filteredItems = itemsList.filter((item) =>
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-blue-100 w-64 h-screen flex flex-col p-0 shadow-lg">
      {/* Search Bar */}
      <div className="mb-4 p-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Items Display */}
      <div className="flex-grow overflow-y-auto scrollbar-custom p-4 pt-0">
        {filteredItems.length > 0 ? (
          <ul className="space-y-4">
            {filteredItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center space-x-4 cursor-pointer"
                onClick={() => onItemClick(item.id)}
              >
                <Icon src={item.url} />
                <span className="text-gray-700 font-semibold">{item.id}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No items found.</p>
        )}
      </div>
    </div>
  );
};

export default SideBar;
