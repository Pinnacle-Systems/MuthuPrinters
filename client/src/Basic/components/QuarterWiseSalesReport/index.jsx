import React, { useState } from "react";
import secureLocalStorage from "react-secure-storage";
import { useGetMonthlySalesReportQuery, useGetQuarterWiseBreakupReportQuery } from "../../../redux/services/salesReportApi";
import { useSelector } from "react-redux";
import { FaTimes, FaSearch } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const QuarterWiseSalesReport = () => {
  const branchId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "currentBranchId"
  );

  const openTabs = useSelector((state) => state.openTabs);
  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const finYearId =
    activeTab?.finYearId ||
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear"
    );

  const { data: salesReportResponse, isLoading } =
    useGetMonthlySalesReportQuery(
      { branchId, finYearId },
      { skip: !branchId || !finYearId }
    );

  const monthlyData = salesReportResponse?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [search, setSearch] = useState({ customer: "", docId: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  const { data: breakupResponse, isLoading: isBreakupLoading } = useGetQuarterWiseBreakupReportQuery(
    { branchId, finYearId, quarterIndex: selectedQuarter },
    { skip: !isModalOpen || !branchId || !finYearId }
  );

  const breakupData = breakupResponse?.data || [];
  const filteredData = breakupData.filter((item) => {
    const matchCustomer = item.customerName.toLowerCase().includes(search.customer.toLowerCase());
    const matchDocId = item.docId.toLowerCase().includes(search.docId.toLowerCase());
    return matchCustomer && matchDocId;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const downloadExcel = async () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Q${selectedQuarter} Sales Breakup`);
    worksheet.columns = [
      { header: "S.No", key: "sno", width: 10 },
      { header: "Type", key: "type", width: 20 },
      { header: "Document ID", key: "docId", width: 20 },
      { header: "Document Date", key: "docDate", width: 20 },
      { header: "Customer", key: "customer", width: 35 },
      { header: "Net Amount", key: "netAmount", width: 20 },
    ];

    worksheet.insertRow(1, [`Quarter ${selectedQuarter} Sales Breakup Report`]);
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
      `Q${selectedQuarter}-Sales-Breakup-Report.xlsx`
    );
  };

  // Group colors by quarter (3 bars each)
  // Q1: Blue, Q2: Green, Q3: Orange, Q4: Purple
  const quarterColors = [
    "#3b82f6", "#3b82f6", "#3b82f6", // Q1
    "#10b981", "#10b981", "#10b981", // Q2
    "#f97316", "#f97316", "#f97316", // Q3
    "#8b5cf6", "#8b5cf6", "#8b5cf6", // Q4
  ];

  const chartLabels = monthlyData.map((d) => {
    // Attempt to convert something like "Apr 26" to "April 2026"
    // Usually d.monthStr is like "2026-04"
    if (d.monthStr) {
      const date = new Date(d.monthStr + "-01");
      return date.toLocaleString("default", { month: "long", year: "numeric" });
    }
    return d.label; // fallback
  });

  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Revenue",
        data: monthlyData.map((d) => d.revenue),
        backgroundColor: quarterColors.slice(0, monthlyData.length),
        borderRadius: 4,
        barThickness: 40,
      },
    ],
  };

  const topLabelsPlugin = {
    id: "topLabelsQuarter",
    afterDatasetsDraw(chart, args, pluginOptions) {
      const { ctx, data } = chart;
      ctx.save();
      chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
        const value = data.datasets[0].data[index];
        if (value !== undefined && value > 0) {
          let formattedValue;
          if (value >= 10000000) {
            formattedValue = `₹ ${(value / 10000000).toFixed(2)} Cr`;
          } else if (value >= 100000) {
            formattedValue = `₹ ${(value / 100000).toFixed(2)} L`;
          } else if (value >= 1000) {
            formattedValue = `₹ ${(value / 1000).toFixed(2)} K`;
          } else {
            formattedValue = new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);
          }
          
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#333";
          ctx.textAlign = "center";
          ctx.fillText(formattedValue, datapoint.x, datapoint.y - 8);
        }
      });
      ctx.restore();
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (evt, element) => {
      if (element.length > 0) {
        const index = element[0].index;
        const monthStr = monthlyData[index]?.monthStr;
        if (monthStr) {
          const m = parseInt(monthStr.split("-")[1], 10);
          const quarter = m >= 4 ? Math.floor((m - 4) / 3) + 1 : 4;
          setSelectedQuarter(quarter);
          setIsModalOpen(true);
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            return new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(context.raw);
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
      },
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
    layout: {
      padding: {
        top: 25,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow w-full mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Quarter Wise Sales Report
      </h3>
      <div style={{ height: "400px" }} className="w-full relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading chart...</p>
          </div>
        ) : (
          <Bar
            data={barData}
            options={chartOptions}
            plugins={[topLabelsPlugin]}
            className="cursor-pointer"
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center">
          <div className="bg-white w-[1300px] h-[630px] p-4 rounded-xl relative flex flex-col">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                <h2 className="font-bold uppercase text-lg">
                  Quarter-Wise Sales Breakup Report
                </h2>
                <select
                  value={selectedQuarter}
                  onChange={(e) => {
                    setSelectedQuarter(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="p-1 border-2 border-blue-600 rounded-md text-sm font-semibold text-blue-600 outline-none"
                >
                  <option value={1}>Q1 (Apr - Jun)</option>
                  <option value={2}>Q2 (Jul - Sep)</option>
                  <option value={3}>Q3 (Oct - Dec)</option>
                  <option value={4}>Q4 (Jan - Mar)</option>
                </select>
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
                {["customer", "docId"].map((key) => (
                  <div key={key} className="relative">
                    <input
                      type="text"
                      placeholder={`Search ${key}...`}
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
              <div className="flex gap-x-2">
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

export default QuarterWiseSalesReport;
