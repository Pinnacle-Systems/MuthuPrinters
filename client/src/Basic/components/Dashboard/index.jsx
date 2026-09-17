import { Bar, Doughnut, Line } from "react-chartjs-2";
import "./Dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useState, useMemo } from "react";
import { getCommonParams } from "../../../Utils/helper";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaStepBackward,
  FaStepForward,
  FaSearch,
} from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  IndianRupee,
  PieChart,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import secureLocalStorage from "react-secure-storage";
import { Login } from "../../pages";
import moment from "moment";
import { useGetDailyProductionReportQuery } from "../../../redux/services/ProductionReportApi";
import { useGetFinYearByIdQuery } from "../../../redux/services/FinYearMasterService";
export default function Form() {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
  );

  const { branchId, userId, finYearId } = getCommonParams();

  const [reportMode, setReportMode] = useState("Date");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("YYYY-MM"),
  );

  const { data: finYearData } = useGetFinYearByIdQuery(finYearId, {
    skip: !finYearId,
  });

  const monthsList = useMemo(() => {
    let start, end;
    const finYear = finYearData?.data || finYearData;
    if (finYear?.from && finYear?.to) {
      start = moment(finYear.from);
      end = moment(finYear.to);
    } else {
      const currentMonth = moment().month(); // 0-11
      const year = currentMonth >= 3 ? moment().year() : moment().year() - 1;
      start = moment(`${year}-04-01`);
      end = moment(`${year + 1}-03-31`);
    }

    const months = [];
    while (start.isBefore(end) || start.isSame(end, "month")) {
      months.push({
        label: start.format("MMMM YYYY"),
        value: start.format("YYYY-MM"),
      });
      start.add(1, "month");
    }
    return months;
  }, [finYearData]);

  const { data: reportResponse, isLoading } = useGetDailyProductionReportQuery({
    date: reportMode === "Date" ? selectedDate : undefined,
    month: reportMode === "Month" ? selectedMonth : undefined,
    branchId: branchId,
  });

  const reportData = reportResponse?.data || [];
  console.log(reportData, "reportData");
  const uniqueJobCardNos = [...new Set(reportData.map((d) => d.jobCardNo))];

  const jobCardBarData = {
    labels: ["Start", "Total Job Cards"],
    datasets: [
      {
        label: "Job Cards Count",
        data: [0, uniqueJobCardNos.length],
        borderColor: "#5CB338",
        backgroundColor: "rgba(92, 179, 56, 0.2)",
        borderWidth: 3,
        pointStyle: "rectRot",
        pointRadius: 10,
        pointHoverRadius: 12,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue ($)",
        data: [12000, 19000, 3000, 5000, 2000, 3000],
        backgroundColor: "#5CB338",
      },
    ],
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Users",
        data: [50, 70, 80, 60, 90, 100],
        fill: false,
        borderColor: "#5CB338",
      },
    ],
  };

  const dummyProducts = [
    { id: 1, name: "Product A", sales: 120 },
    { id: 2, name: "Product B", sales: 80 },
    { id: 3, name: "Product C", sales: 150 },
  ];

  const [chatData] = useState({
    labels: ["Messages", "Users", "Active Chats", "Archived", "Pending"],
    datasets: [
      {
        data: [700, 150, 100, 300, 150],
        backgroundColor: [
          "#6366F1",
          "#22C55E",
          "#F97316",
          "#EC4899",
          "#8B5CF6",
        ],
        borderColor: ["#6366F1", "#22C55E", "#F97316", "#EC4899", "#8B5CF6"],
        borderWidth: 1,
      },
    ],
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        display: true,
        labels: {
          boxWidth: 10,
          boxHeight: 5,
          padding: 12,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        padding: 10,
        bodyFont: {
          size: 12,
        },
        titleFont: {
          size: 14,
        },
      },
    },
    cutout: "65%",
  };

  const data2 = {
    labels: ["Jan", "Feb", "Mar", "April", "May"],
    datasets: [
      {
        label: "Sales",
        data: [65, 59, 80, 81, 56],
        backgroundColor: "#5DADE2",
        border: "none",
      },
    ],
  };

  const options2 = {
    indexAxis: "y",
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        categoryPercentage: 0.6,
        barPercentage: 0.8,
      },
    },
  };

  const cardsData = [
    {
      label: "Revenue",
      value: "$2500",
      logo: <IndianRupee size={50} color={"#30b5fc "} />,
      increase: true,
      percentage: "5%",
    },
    {
      label: "Increase",
      value: "15%",
      logo: <TrendingUp size={50} color={"#399918"} />,
      increase: true,
      percentage: "15%",
    },
    {
      label: "Users",
      value: 150,
      logo: <UsersRound size={50} color={"#FF885B "} />,
      increase: true,
      percentage: "10%",
    },
    {
      label: "Manufacturers ",
      value: 50,
      logo: <UserCheck size={50} color={"#BE5985"} />,
      increase: true,
      percentage: "10%",
    },
    {
      label: "Vendors",
      value: 100,
      logo: <UserCheck size={50} color={"grey"} />,
      increase: true,
      percentage: "10%",
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState({});

  const filteredData = useMemo(() => {
    return reportData.filter((row) => {
      if (
        search.jobCardNo &&
        !row.jobCardNo?.toLowerCase().includes(search.jobCardNo.toLowerCase())
      )
        return false;
      if (
        search.orderNo &&
        !row.orderNo?.toLowerCase().includes(search.orderNo.toLowerCase())
      )
        return false;
      if (
        search.processName &&
        !row.processName
          ?.toLowerCase()
          .includes(search.processName.toLowerCase())
      )
        return false;
      return true;
    });
  }, [reportData, search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const downloadExcel = async () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daily Production Report");
    worksheet.columns = [
      { header: "S.No", key: "sno", width: 10 },
      { header: "Job Card No", key: "jobCardNo", width: 25 },
      { header: "Order No", key: "orderNo", width: 25 },
      { header: "Process Name", key: "processName", width: 25 },
      { header: "Status", key: "status", width: 15 },
      { header: "Machine", key: "machine", width: 25 },
      { header: "User", key: "user", width: 15 },
      { header: "Department", key: "department", width: 20 },
      { header: "Start Time", key: "startTime", width: 15 },
      { header: "End Time", key: "endTime", width: 15 },
      { header: "Hours Worked", key: "hoursWorked", width: 15 },
      { header: "Completed Qty", key: "completedQty", width: 15 },
      { header: "Pending Qty", key: "pendingQty", width: 15 },
      { header: "Wastage Qty", key: "wastageQty", width: 15 },
      { header: "Pause Info", key: "pauseInfo", width: 30 },
    ];

    worksheet.insertRow(1, ["Daily Production Report"]);
    worksheet.mergeCells("A1:O1");
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
      let pauseInfo = "None";
      if (r.pushLogs?.length > 0) {
        pauseInfo = r.pushLogs
          .map((log) => `${log.pauseReason || "Paused"} (Qty: ${log.pauseQty})`)
          .join(", ");
      }
      worksheet.addRow({
        sno: index + 1,
        jobCardNo: r.jobCardNo,
        orderNo: r.orderNo,
        processName: r.processName,
        status: r.processStatus,
        machine: r.machine,
        user: r.username,
        department: r.department,
        startTime: r.startTime ? moment(r.startTime).format("HH:mm:ss") : "N/A",
        endTime: r.endTime ? moment(r.endTime).format("HH:mm:ss") : "N/A",
        hoursWorked: r.hoursWorked,
        completedQty: r.completedQty,
        pendingQty: r.pendingQty,
        wastageQty: r.wastageQty,
        pauseInfo: pauseInfo,
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
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Daily Production Report.xlsx",
    );
  };
  return (
    <>
      {userId ? (
        <>
          <div className="m-5 mt-2 overflow-auto ">
            <header className="mb-6">
              <h4 className="text-2xl font-bold   text-gray-800">
                Organization Dashboard
              </h4>
            </header>

            {/* Cards Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {cardsData.map((card, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg shadow transition-transform transform hover:scale-105 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">{card.label}</p>
                      <h4 className="text-lg font-semibold">{card.value}</h4>
                      <p className="mb-0 text-[11px] text-gray-500 flex items-center">
                        {card.label === "Inactive Users" ? (
                          <span className=" mt-0.5">Inactive Users</span>
                        ) : (
                          <div className="d-flex flex-wrap">
                            <span
                              className={`${card.increase ? "text-green-600" : "text-red-600"} fw-semibold text-xs `}
                            >
                              {card.increase ? "+" : "-"}
                              {card.percentage} &nbsp;
                            </span>
                            <span> since last month</span>
                          </div>
                        )}
                      </p>
                    </div>
                    <div>{card.logo}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Section */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h6 className="text-xl font-bold text-gray-800">
                      Daily Production Report: {uniqueJobCardNos.length}
                    </h6>
                    <p className="text-sm text-gray-500">
                      Click the chart to view the detailed report table
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={reportMode}
                      onChange={(e) => {
                        e.stopPropagation();
                        setReportMode(e.target.value);
                      }}
                      className="p-2 border rounded-md text-xs"
                    >
                      <option value="Date">Date</option>
                      <option value="Month">Month</option>
                    </select>
                    {reportMode === "Date" ? (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedDate(e.target.value);
                        }}
                        className="p-2 border rounded-md text-xs"
                      />
                    ) : (
                      <select
                        value={selectedMonth}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedMonth(e.target.value);
                        }}
                        className="p-2 border rounded-md text-xs max-w-[150px]"
                      >
                        {monthsList.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div
                  className="mt-4 h-80 cursor-pointer transition-transform transform hover:scale-[1.01]"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Line
                    data={jobCardBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          suggestedMax:
                            Math.max(uniqueJobCardNos.length, 5) + 2,
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Bar Chart - Monthly Revenue */}
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h6 className="text-lg font-semibold mb-2">Monthly Revenue</h6>
                <Bar data={barData} className="mt-4" />
              </div>

              {/* Line Chart - User Growth */}
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h6 className="text-lg font-semibold mb-2">Business Growth</h6>
                <Line data={lineData} className="mt-4" />
              </div>

              {/* Doughnut Chart - Chat Analytics */}
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <div className="flex items-center">
                  <PieChart className="w-6 h-6 text-indigo-600 mr-2" />
                  <h6 className="text-xl font-bold text-gray-800">
                    Chat Analytics
                  </h6>
                </div>
                <div className="mt-3">
                  <Doughnut data={chatData} options={options} />
                </div>
              </div>

              {/* Bar Chart - Monthly Sales */}
              <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                <h6 className="text-lg font-semibold mb-2">Monthly Sales</h6>
                <Bar data={data2} options={options2} className="h-full mt-4" />
              </div>
            </div>

            {/* Dashboard Overview Table Section */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h5 className="text-lg font-semibold mb-2">Dashboard Overview</h5>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 border-b">Orders Placed</th>
                    <th className="text-left p-2 border-b">Pending Quotes</th>
                    <th className="text-left p-2 border-b">
                      Deliveries Expected
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="text-left p-2 border-b">38 this month</th>
                    <th className="text-left p-2 border-b">5</th>
                    <th className="text-left p-2 border-b">8</th>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table Section */}
            {/* Modal for Table */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center">
                <div className="bg-white w-[1300px] h-[630px] p-4 rounded-xl relative flex flex-col">
                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-4">
                      <h2 className="font-bold uppercase text-lg">
                        Daily Production Report
                      </h2>
                      <select
                        value={reportMode}
                        onChange={(e) => setReportMode(e.target.value)}
                        className="p-1 border-2 border-blue-600 rounded-md text-xs font-semibold text-blue-600 outline-none"
                      >
                        <option value="Date">Date</option>
                        <option value="Month">Month</option>
                      </select>
                      {reportMode === "Date" ? (
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="p-1 border-2 border-blue-600 rounded-md text-xs font-semibold text-blue-600 outline-none"
                        />
                      ) : (
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="p-1 border-2 border-blue-600 rounded-md text-xs font-semibold text-blue-600 outline-none max-w-[150px]"
                        >
                          {monthsList.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <button
                        className="text-red-600"
                        onClick={() => setIsModalOpen(false)}
                      >
                        <FaTimes size={20} />
                      </button>
                    </div>
                  </div>

                  {/* SEARCH & DOWNLOAD */}
                  <div className="flex justify-between items-start mt-2 border-b pb-2 mb-2">
                    <div className="flex gap-x-4 mb-3">
                      {["jobCardNo", "orderNo", "processName"].map((key) => (
                        <div key={key} className="relative">
                          <input
                            type="text"
                            placeholder={`Search ${key}...`}
                            value={search[key] || ""}
                            onChange={(e) =>
                              setSearch({ ...search, [key]: e.target.value })
                            }
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
                            <th className="border p-1 text-center w-12">
                              S.No
                            </th>
                            <th className="border p-1 text-center w-32">
                              Job Card No
                            </th>
                            <th className="border p-1 text-center w-32">
                              Order No
                            </th>
                            <th className="border p-1 text-center w-40">
                              Process Name
                            </th>
                            <th className="border p-1 text-center w-32">
                              Status
                            </th>
                            <th className="border p-1 text-center w-40">
                              Machine
                            </th>
                            <th className="border p-1 text-center w-32">
                              User
                            </th>
                            <th className="border p-1 text-center w-40">
                              Department
                            </th>
                            <th className="border p-1 text-center w-20">
                              Start Time
                            </th>
                            <th className="border p-1 text-center w-20">
                              End Time
                            </th>
                            <th className="border p-1 text-center w-28">
                              Hours Worked
                            </th>
                            <th className="border p-1 text-center w-28">
                              Production Qty
                            </th>
                            <th className="border p-1 text-center w-28">
                              Completed Qty
                            </th>

                            <th className="border p-1 text-center w-20">
                              Pending Qty
                            </th>
                            <th className="border p-1 text-center w-24">
                              Wastage Qty
                            </th>
                            <th className="border p-1 text-center w-52">
                              Pause Info
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td
                                colSpan={15}
                                className="h-[300px] text-center"
                              >
                                <div className="flex justify-center items-center">
                                  <p>Loading...</p>
                                </div>
                              </td>
                            </tr>
                          ) : currentItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={15}
                                className="text-center py-6 text-gray-500"
                              >
                                No data found
                              </td>
                            </tr>
                          ) : (
                            currentItems.map((row, index) => {
                              const globalIndex = index;
                              const serialNo =
                                (currentPage - 1) * itemsPerPage +
                                globalIndex +
                                1;
                              return (
                                <tr
                                  key={row.id || index}
                                  className="text-gray-800 bg-white even:bg-gray-100"
                                >
                                  <td className="border p-1 text-center">
                                    {serialNo}
                                  </td>
                                  <td className="border p-1 pl-2 text-left">
                                    {row.jobCardNo}
                                  </td>
                                  <td className="border p-1 pl-2 text-left">
                                    {row.orderNo}
                                  </td>
                                  <td className="border p-1 pl-2 text-left">
                                    {row.processName}
                                  </td>
                                  <td className="border p-1 text-left">
                                    {row.processStatus}
                                  </td>
                                  <td className="border p-1 pl-2 text-left">
                                    {row.machine}
                                  </td>
                                  <td className="border p-1 text-left">
                                    {row.username}
                                  </td>
                                  <td className="border p-1 pl-2 text-left">
                                    {row.department}
                                  </td>
                                  <td className="border p-1 text-center">
                                    {row.startTime
                                      ? moment(row.startTime).format("HH:mm:ss")
                                      : "N/A"}
                                  </td>
                                  <td className="border p-1 text-center">
                                    {row.endTime
                                      ? moment(row.endTime).format("HH:mm:ss")
                                      : "N/A"}
                                  </td>
                                  <td className="border p-1 text-center">
                                    {row.hoursWorked}
                                  </td>
                                  <td className="border p-1 text-right pr-2">
                                    {row.productionQty}
                                  </td>
                                  <td className="border p-1 text-right pr-2">
                                    {row.completedQty}
                                  </td>
                                  <td className="border p-1 text-right pr-2">
                                    {row.pendingQty}
                                  </td>
                                  <td className="border p-1 text-right pr-2">
                                    {row.wastageQty}
                                  </td>
                                  <td className="border p-1 pl-2 text-left">
                                    {row.pushLogs?.length > 0
                                      ? row.pushLogs
                                          .map(
                                            (log) =>
                                              `${log.pauseReason || "Paused"} (Qty: ${log.pauseQty})`,
                                          )
                                          .join(", ")
                                      : "None"}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PAGINATION */}
                  <div>
                    <div
                      className="flex justify-end items-center mt-4 space-x-2 text-[11px]"
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "20px",
                      }}
                    >
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-gray-200"
                        }`}
                      >
                        <FaStepBackward size={16} />
                      </button>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-gray-200"
                        }`}
                      >
                        <FaChevronLeft size={16} />
                      </button>

                      <span className="text-xs font-semibold px-3">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-gray-200"
                        }`}
                      >
                        <FaChevronRight size={16} />
                      </button>

                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:bg-gray-200"
                        }`}
                      >
                        <FaStepForward size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <Login />
        </>
      )}
    </>
  );
}
