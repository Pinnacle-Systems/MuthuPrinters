import React, { useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { useSelector } from "react-redux";
import { useGetCustomerWiseSalesReportQuery } from "../../../redux/services/salesReportApi";
import { useGetPartyQuery } from "../../../redux/services/PartyMasterService";
import Select from "react-select";

const CustomerWiseSalesReport = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const branchId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "currentBranchId",
  );
  const companyId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "userCompanyId",
  );

  const openTabs = useSelector((state) => state.openTabs);
  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const finYearId =
    activeTab?.finYearId ||
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear",
    );

  const { data: partyListData, isLoading: isPartiesLoading } = useGetPartyQuery(
    {
      params: { branchId, companyId },
    },
  );

  const partyOptions =
    partyListData?.data?.map((party) => ({
      value: party.id,
      label: party.name,
    })) || [];

  const {
    data: salesReportResponse,
    isLoading: isReportLoading,
    isFetching,
  } = useGetCustomerWiseSalesReportQuery(
    { branchId, finYearId, customerId: selectedCustomer?.value },
    { skip: !branchId || !finYearId || !selectedCustomer },
  );

  const totalRevenue = salesReportResponse?.data?.[0]?.revenue || 0;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div
      className="bg-white p-6 rounded-lg shadow w-full mb-6"
      style={{ height: "450px" }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 md:mb-0">
          Customer Wise Sales Report
        </h3>
        <div className="w-full md:w-64 text-xs">
          <Select
            options={partyOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Search Customer..."
            isLoading={isPartiesLoading}
            isClearable
          />
        </div>
      </div>

      {selectedCustomer ? (
        <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
          <h4 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
            Total Sales for {selectedCustomer.label}
          </h4>
          {isReportLoading || isFetching ? (
            <p className="text-gray-500 mt-2">Loading data...</p>
          ) : (
            <span className="text-4xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </span>
          )}
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">
            Please select a customer to view their total sales.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerWiseSalesReport;
