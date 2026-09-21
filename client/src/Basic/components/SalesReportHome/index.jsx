import React from "react";
import secureLocalStorage from "react-secure-storage";
import { useSelector, useDispatch } from "react-redux";
import MonthWiseSalesReport from "../MonthWiseSalesReport";
import CustomerWiseSalesReport from "../CustomerWiseSalesReport";
import YearWiseSalesReport from "../YearWiseSalesReport";
import QuarterWiseSalesReport from "../QuarterWiseSalesReport";
import { push } from "../../../redux/features/opentabs";
import { useGetFinYearQuery } from "../../../redux/services/FinYearMasterService";
import { getYearShortCode } from "../../../Utils/helper";

const SalesReportHome = () => {
  const dispatch = useDispatch();
  const openTabs = useSelector((state) => state.openTabs);
  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const shortCode = activeTab?.shortCode || "";
  const finYearId =
    activeTab?.finYearId ||
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear",
    );

  const { data: allFinYearsData } = useGetFinYearQuery({});
  const allFinYears = allFinYearsData?.data || [];

  const handleFinYearChange = (e) => {
    const newFinYearId = parseInt(e.target.value);
    const selectedFy = allFinYears.find((fy) => fy.id === newFinYearId);
    if (selectedFy) {
      const newShortCode =
        selectedFy.from && selectedFy.to
          ? getYearShortCode(selectedFy.from, selectedFy.to)
          : selectedFy.id;
      dispatch(
        push({
          name: "MONTH WISE SALES REPORT",
          finYearId: newFinYearId,
          shortCode: newShortCode,
        }),
      );
    }
  };

  return (
    <div
      className="bg-gray-200 h-full overflow-y-auto pb-20"
      style={{ maxHeight: "calc(100vh - 120px)" }}
    >
      <div className="w-full p-4">
        <div className="flex items-center justify-between bg-blue-500 mb-4 font-bold p-2">
          <h1 className="text-2xl text-white">
            Sales Report Distribution {shortCode ? `- ${shortCode}` : ""}
          </h1>
          <div className="flex items-center">
            <span className="text-white mr-2 text-sm">Fin. Year:</span>
            <select
              value={finYearId}
              onChange={handleFinYearChange}
              className="p-1 border border-transparent rounded text-sm text-gray-800 bg-white cursor-pointer focus:outline-none"
            >
              {allFinYears.map((fy) => {
                const fyShortCode =
                  fy.from && fy.to ? getYearShortCode(fy.from, fy.to) : fy.id;
                return (
                  <option key={fy.id} value={fy.id}>
                    {fyShortCode}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Month-wise and Year-wise side by side */}

        {/* Quarter Wise Report */}
        <QuarterWiseSalesReport />
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="w-full lg:w-[70%]">
            <MonthWiseSalesReport />
          </div>
          <div className="w-full lg:w-[30%]">
            <YearWiseSalesReport />
          </div>
        </div>
        {/* Customer Wise Report */}
        <div className="w-full lg:w-[50%]">
          <CustomerWiseSalesReport />
        </div>

        {/* Future components can be added below this line */}
      </div>
    </div>
  );
};

export default SalesReportHome;
