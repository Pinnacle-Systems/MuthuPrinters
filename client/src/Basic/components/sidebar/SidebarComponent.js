import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import secureLocalStorage from "react-secure-storage";
import { push } from "../../../redux/features/opentabs";
import { useNavigate } from "react-router-dom";
import { Gamepad2, HandCoins, LayoutDashboard, Search, University, Volleyball } from "lucide-react";
// import { GrUserWorker } from "react-icons/gr";
import { TfiWorld } from "react-icons/tfi";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineMyLocation } from "react-icons/md";
import { TbCalendarDollar } from "react-icons/tb";
import { LuUserCheck } from "react-icons/lu";
import { BiCategoryAlt } from "react-icons/bi";
import { MdCurrencyRupee } from "react-icons/md";
import { IoColorPaletteOutline } from "react-icons/io5";
import { TbRulerMeasure2 } from "react-icons/tb";
import { HiOutlineReceiptTax } from "react-icons/hi";
import { HiReceiptTax } from "react-icons/hi";
import { PiTShirtThin } from "react-icons/pi";
import { FaMapLocationDot } from "react-icons/fa6";
import { PiSock } from "react-icons/pi";
import { PiSockFill } from "react-icons/pi";
// import { MdWifiProtectedSetup } from "react-icons/md";
// import { LuProportions } from "react-icons/lu";
import { BsQuestionOctagon } from "react-icons/bs";
import { FaCottonBureau } from "react-icons/fa6";
import { GiYarn } from "react-icons/gi";
import { PiYarnLight } from "react-icons/pi";
// import { GiRolledCloth } from "react-icons/gi";
// import { SiGsmarenadotcom } from "react-icons/si";
// import { AiOutlineNumber } from "react-icons/ai";
// import { PiScribbleLoopBold } from "react-icons/pi";
// import { MdDesignServices } from "react-icons/md";
import { FaSocks } from "react-icons/fa6";
import { GiFoldedPaper } from "react-icons/gi";
import { TbNeedleThread } from "react-icons/tb";

// import country from './images/flag.png';
// import material from './images/style.png'
// import employee from "./images/employee.png";
// import state from "./images/map.png";
// import city from "./images/city.png";
// import department from "./images/department.png";
// import calender from "./images/calender.png";
// import empcategory from "./images/empcategory.png";
// import partycategory from "./images/partycategory.png";
// import currency from "./images/currency.png";
// import party from "./images/party.png";
// import color from "./images/color.png";
// import payterm from "./images/payterm.png"
// import taxterm from "./images/tax.png";
// import taxtemplate from "./images/taxtemplate.png";
// import size from "./images/size.png";
// import style from "./images/style.png";
// import location from "./images/location.png";
// import sizetemplate from "./images/sizetemplate.png";
// import lossreason from "./images/reason.png";
// import yarncontent from "./images/cotton.png";
// import yarntype from "./images/yarntype.png";
// import yarnblend from "./images/yarnblend.png";
// import yarn from "./images/yarn.png";
// import yarncount from "./images/yarncount.png";
// import accessorygroup from "./images/accessorygroup.png";
// import accessory from "./images/accessory.png";
// import accessoryitem from "./images/accessoryitem.png"
// import Machine from "./images/Machine.jpeg";
import { useGetPageGroupQuery } from "../../../redux/services/PageGroupMasterServices";
import axios from "axios";
import { MachineMaster } from "..";


const SidebarComponent = ({ logo, groups, pages, isMainDropdownOpen, setIsMainDropdownOpen, heading, setIsOpen }) => {
  const dispatch = useDispatch();

  const [hoveredGroupId, setHoveredGroupId] = useState(null);
  const navigate = useNavigate();


  // console.log(groups, "groups")
  // const priority = {
  //   "SAMPLE": 1,
  //   "ORDER": 2,
  //   "PURCHASE": 3,
  //   "OPENING STOCK": 4
  // };
  // groups.sort((a, b) => priority[a.name] - priority[b.name]);

  const [search, setSearch] = useState("");

  const filteredData = pages.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const iconMapping = {

 
  

    
  
    }
  return (
    <div className="fixed top-[3.5%] left-[87px] z-50">
      {isMainDropdownOpen && (
        <div
          onClick={() => {setIsMainDropdownOpen(false) ;setIsOpen(false);}}
          className="bg-black/50 fixed inset-0 -z-10"
        ></div>
      )}

      {isMainDropdownOpen && (
        <div className="bg-white p-4 rounded-lg shadow-2xl outline outline-1 outline-gray-300 h-[650px] overflow-y-auto w-[400px] transition-all duration-200 space-y-4">

          <div className="relative">
            <input
              type="text"
              name="masters"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-3 pr-10 py-2 text-sm text-gray-700 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 right-3 flex items-center text-gray-500">
              <Search size={16} />
            </div>
          </div>

          <ul className="space-y-2">
            {groups?.map((group) => (
              <li key={group?.id} className="space-y-1">
                {search.length === 0 && (
                  <h3 className="text-sm font-semibold text-gray-700 pl-2 uppercase tracking-wide">
                    {/* {(group?.name + " Module").replace(/\b[a-z]/g, char => char.toUpperCase())} */}
                    {`${`${group?.name} ${group?.type ? group?.type : ""}`.replace(/\b[a-z]/g, char => char.toUpperCase())}`}
                  </h3>
                )}

                <ul className="grid grid-cols-4 gap-2 pt-1">
                  {filteredData
                    .filter(page => parseInt(page.pageGroupId) === parseInt(group.id))
                    .map(page => (
                      <li
                        key={page.id}
                        onClick={() => {
                          dispatch(push(page));
                          secureLocalStorage.setItem(
                            sessionStorage.getItem("sessionId") + "currentPage",
                            page?.id
                          );
                          setIsMainDropdownOpen(false);
                          setIsOpen(false);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 rounded-lg p-2 text-xs text-center cursor-pointer transition-all duration-150"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="mb-1">
                            {iconMapping[page?.name] || <span className="text-gray-400">🔘</span>}
                          </div>
                          <div className="text-[10px] leading-tight">
                            {page?.name
                              .replace(/\bMASTER\b/g, "")
                              .trim()
                              .toLowerCase()
                              .replace(/\b[a-z]/g, (char) => char.toUpperCase())}
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

  );
};
export default SidebarComponent;
