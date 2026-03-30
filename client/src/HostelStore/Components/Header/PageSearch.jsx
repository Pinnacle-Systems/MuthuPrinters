import React, { useEffect, useState } from "react";
import useOutsideClick from "../../../CustomHooks/handleOutsideClick";
import { useDispatch } from "react-redux";
import { push } from "../../../redux/features/opentabs";
import { Search } from "@mui/icons-material";

const PageSearch = ({ pageList }) => {
  const [isListShow, setIsListShow] = useState(false);
  const inputRef = useOutsideClick(() => {
    setIsListShow(false);
  });
  const [filteredPages, setFilteredPages] = useState(pageList);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!search) {
      setFilteredPages(pageList);
      return;
    }
    setFilteredPages(
      pageList.filter((page) =>
        page.name.toLowerCase().includes(search.toLowerCase())
      )
    );
    setFocusedIndex(-1);
  }, [search, pageList]);

  const handleKeyDown = (e) => {
    if (!isListShow || filteredPages.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < filteredPages.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredPages.length - 1
      );
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      const selectedPage = filteredPages[focusedIndex];
      dispatch(push(selectedPage));
      setSearch("");
      setIsListShow(false);
      setFocusedIndex(-1);
    } else if (e.key === "Escape") {
      setIsListShow(false);
      setFocusedIndex(-1);
    }
  };

  const handleSelectPage = (page) => {
    dispatch(push(page));
    setSearch("");
    setIsListShow(false);
    setFocusedIndex(-1);
  };

  return (
    <div className="relative w-[300px]" ref={inputRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="SEARCH PAGES..."
          className="w-full px-3 py-2 pr-8 text-sm font-normal text-gray-700 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-[30px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsListShow(true)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search size={14} />
        </div>
      </div>

      {isListShow && filteredPages.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-[250px] overflow-auto">
          {filteredPages.map((page, index) => (
            <li
              key={page.id}
              className={`px-3 py-2 text-sm font-normal cursor-pointer transition-colors ${index === focusedIndex
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
                }`}
              onClick={() => handleSelectPage(page)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {page.name}
            </li>
          ))}
        </ul>
      )}

      {isListShow && filteredPages.length === 0 && search && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-sm text-gray-500">
          No results found
        </div>
      )}
    </div>
  );
};

export default PageSearch;
