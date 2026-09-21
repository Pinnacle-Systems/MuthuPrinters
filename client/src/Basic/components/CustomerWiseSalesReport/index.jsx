import React, { useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { useSelector } from "react-redux";
import { useGetCustomerWiseSalesReportQuery, useGetCustomerWiseBreakupReportQuery } from "../../../redux/services/salesReportApi";
import { useGetPartyQuery } from "../../../redux/services/PartyMasterService";
import Select from "react-select";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FaTimes, FaSearch } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerWiseSalesReport = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const branchId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "currentBranchId"
  );
  const companyId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "userCompanyId"
  );

  const openTabs = useSelector((state) => state.openTabs);
  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const finYearId =
    activeTab?.finYearId ||
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear"
    );

  const { data: partyListData, isLoading: isPartiesLoading } = useGetPartyQuery({
    params: { branchId, companyId },
  });

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
    { skip: !branchId || !finYearId || !selectedCustomer }
  );

  const totalRevenue = salesReportResponse?.data?.[0]?.revenue || 0;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState({ customer: "", docId: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  const { data: breakupResponse, isLoading: isBreakupLoading } = useGetCustomerWiseBreakupReportQuery(
    { branchId, finYearId, customerId: selectedCustomer?.value },
    { skip: !isModalOpen || !branchId || !finYearId || !selectedCustomer }
  );

  const breakupData = breakupResponse?.data || [];
  const filteredData = breakupData.filter((item) => {
    const matchCustomer = item.customerName.toLowerCase().includes(search.customer.toLowerCase());
    const matchDocId = item.docId.toLowerCase().includes(search.docId.toLowerCase());
    return matchCustomer && matchDocId;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const downloadExcel = async () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer-Wise Sales Breakup");
    worksheet.columns = [
      { header: "S.No", key: "sno", width: 10 },
      { header: "Type", key: "type", width: 20 },
      { header: "Document ID", key: "docId", width: 20 },
      { header: "Document Date", key: "docDate", width: 20 },
      { header: "Customer", key: "customer", width: 35 },
      { header: "Net Amount", key: "netAmount", width: 20 },
    ];

    worksheet.insertRow(1, [`Sales Breakup for ${selectedCustomer?.label}`]);
    worksheet.mergeCells("A1:F1");
    const titleCell = worksheet.getCell("A1");
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 30;

    const headerRow = worksheet.getRow(2);
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    filteredData.forEach((r, index) => {
      worksheet.addRow({
        sno: index + 1,
        type: r.type,
        docId: r.docId,
        docDate: new Date(r.docDate).toLocaleDateString("en-IN"),
        customer: r.customerName,
        netAmount: r.netAmount,
      });
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;
      row.height = 22;
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
      });
    });

    worksheet.views = [{ state: "frozen", ySplit: 2 }];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Customer-Wise-Breakup-${selectedCustomer?.label.replace(/\s+/g, '-')}.xlsx`
    );
  };

  const barData = {
    labels: [selectedCustomer?.label || "Select Customer"],
    datasets: [
      {
        label: "Total Sales",
        data: [totalRevenue],
        backgroundColor: "#f97316",
        borderRadius: 4,
        barThickness: 80,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (evt, element) => {
      if (element.length > 0) {
        setIsModalOpen(true);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(1)} Cr`;
            if (value >= 100000) return `₹ ${(value / 100000).toFixed(1)} L`;
            if (value >= 1000) return `₹ ${(value / 1000).toFixed(1)} K`;
            return `₹ ${value}`;
          },
        },
      },
    },
  };

  const topLabelsPlugin = {
    id: "topLabelsCustomer",
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart;
      ctx.save();
      chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
        const value = data.datasets[0].data[index];
        if (value !== undefined && value > 0) {
          let formattedValue;
          if (value >= 10000000) formattedValue = `₹ ${(value / 10000000).toFixed(2)} Cr`;
          else if (value >= 100000) formattedValue = `₹ ${(value / 100000).toFixed(2)} L`;
          else formattedValue = formatCurrency(value);
          
          ctx.font = "bold 13px sans-serif";
          ctx.fillStyle = "#333";
          ctx.textAlign = "center";
          ctx.fillText(formattedValue, datapoint.x, datapoint.y - 8);
        }
      });
      ctx.restore();
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow w-full mb-6 flex flex-col min-h-[450px]">
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

      <div className="flex-1 w-full h-full relative" style={{ minHeight: "300px" }}>
        {selectedCustomer ? (
          isReportLoading || isFetching ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 mt-2">Loading data...</p>
            </div>
          ) : (
            <Bar
              data={barData}
              options={chartOptions}
              plugins={[topLabelsPlugin]}
              className="cursor-pointer hover:opacity-90 transition"
            />
          )
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg h-full flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">
              Please select a customer to view their total sales.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center">
          <div className="bg-white w-[1300px] h-[630px] p-4 rounded-xl relative flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <h2 className="font-bold uppercase text-lg">
                  Breakup for {selectedCustomer?.label}
                </h2>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  className="text-red-600 hover:text-red-800 transition"
                  onClick={() => setIsModalOpen(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* SEARCH & DOWNLOAD */}
            <div className="flex justify-between items-start mt-2 border-b pb-2 mb-2">
              <div className="flex gap-x-4 mb-3">
                {["docId"].map((key) => (
                  <div key={key} className="relative">
                    <input
                      type="text"
                      placeholder={`Search Document ID...`}
                      value={search[key] || ""}
                      onChange={(e) => {
                        setSearch({ ...search, [key]: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full h-8 p-1 pl-8 text-gray-900 text-[11px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                    />
                    <FaSearch className="absolute left-2 top-2 text-gray-500 text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex gap-x-3 items-center">
                <div className="w-48 text-[11px] font-normal capitalize">
                  <Select
                    options={partyOptions}
                    value={selectedCustomer}
                    onChange={(customer) => {
                      setSelectedCustomer(customer);
                      setCurrentPage(1);
                    }}
                    placeholder="Search Customer..."
                    isLoading={isPartiesLoading}
                    isClearable
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: '32px',
                        height: '32px',
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: '0 8px',
                      }),
                      input: (base) => ({
                        ...base,
                        margin: '0',
                        padding: '0',
                      }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        height: '32px',
                      }),
                    }}
                  />
                </div>
                <button
                  onClick={downloadExcel}
                  className="p-0 rounded-full shadow-md hover:brightness-110 transition-all duration-300"
                  title="Download Excel"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/732/732220.png"
                    alt="Download Excel"
                    className="w-8 h-8 rounded-lg"
                  />
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div className="grid gap-4 flex-1">
              <div
                className="overflow-x-auto h-[440px]"
                style={{ border: "1px solid gray", borderRadius: "16px" }}
              >
                <table className="w-full border-collapse border border-gray-300 text-[11px] table-fixed">
                  <thead className="bg-gray-100 text-gray-800 sticky top-0 tracking-wider">
                    <tr>
                      <th className="border p-1 text-center w-12">S.No</th>
                      <th className="border p-1 text-center w-32">Type</th>
                      <th className="border p-1 text-center w-40">Document ID</th>
                      <th className="border p-1 text-center w-32">Document Date</th>
                      <th className="border p-1 text-center w-64">Customer</th>
                      <th className="border p-1 text-center w-32">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {isBreakupLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10">Loading data...</td>
                      </tr>
                    ) : paginatedData.length > 0 ? (
                      paginatedData.map((row, i) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="border p-1 text-center">
                            {(currentPage - 1) * itemsPerPage + i + 1}
                          </td>
                          <td className="border p-1 text-center">{row.type}</td>
                          <td className="border p-1 text-center font-medium text-blue-600">
                            {row.docId}
                          </td>
                          <td className="border p-1 text-center text-gray-600">
                            {new Date(row.docDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className="border p-1 text-center truncate">{row.customerName}</td>
                          <td className="border p-1 text-center font-semibold text-green-700">
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(row.netAmount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-gray-500">No records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-3 pt-2 border-t">
                <span className="text-xs text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1 bg-gray-200 rounded-md text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1 bg-gray-200 rounded-md text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerWiseSalesReport;
