import React from "react";
import secureLocalStorage from "react-secure-storage";
import { useGetMonthlySalesReportQuery } from "../../../redux/services/salesReportApi";
import { useSelector } from "react-redux";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const MonthWiseSalesReport = () => {
  const branchId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "currentBranchId",
  );

  // Try to get finYearId from Redux tab payload (if passed via push) or secureLocalStorage
  const openTabs = useSelector((state) => state.openTabs);
  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const finYearId =
    activeTab?.finYearId ||
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear",
    );

  const { data: salesReportResponse, isLoading } =
    useGetMonthlySalesReportQuery(
      { branchId, finYearId },
      { skip: !branchId || !finYearId },
    );

  const monthlyData = salesReportResponse?.data || [];
  const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.revenue, 0);
  console.log(salesReportResponse, "monthlyData");

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCompact = (num) => {
    if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹ ${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹ ${(num / 1000).toFixed(2)} K`;
    return `₹ ${num.toFixed(2)}`;
  };

  const lineData = {
    labels: monthlyData.map((d) => d.label.split(" ")[0].toUpperCase()),
    datasets: [
      {
        label: "Revenue",
        data: monthlyData.map((d) => d.revenue),
        borderColor: "#0ea5e9", // A nice bright blue
        backgroundColor: "#0ea5e9",
        borderWidth: 3,
        pointBackgroundColor: [
          "#3b82f6",
          "#06b6d4",
          "#10b981",
          "#f59e0b",
          "#f97316",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
          "#6366f1",
          "#84cc16",
          "#f43f5e",
        ],
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
      },
    ],
  };

  const topLabelsPlugin = {
    id: "topLabelsLine",
    afterDatasetsDraw(chart) {
      const { ctx, data } = chart;
      ctx.save();
      chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
        const value = data.datasets[0].data[index];
        if (value !== undefined) {
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#374151";
          ctx.textAlign = "center";
          ctx.fillText(formatCompact(value), datapoint.x, datapoint.y - 12);
        }
      });
      ctx.restore();
    },
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 30, bottom: 30, left: 10, right: 10 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => formatCurrency(context.raw),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCompact(value),
        },
        grid: { borderDash: [5, 5] },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <>
      <div
        className="bg-white p-6 rounded-lg shadow w-full"
        style={{ height: "450px" }}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Month wise sales report
        </h3>
        {isLoading ? (
          <p>Loading chart...</p>
        ) : (
          <Line
            data={lineData}
            options={chartOptions}
            plugins={[topLabelsPlugin]}
          />
        )}
      </div>
    </>
  );
};

export default MonthWiseSalesReport;
