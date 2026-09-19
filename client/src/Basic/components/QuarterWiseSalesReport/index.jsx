import React from "react";
import secureLocalStorage from "react-secure-storage";
import { useGetMonthlySalesReportQuery } from "../../../redux/services/salesReportApi";
import { useSelector } from "react-redux";
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
          />
        )}
      </div>
    </div>
  );
};

export default QuarterWiseSalesReport;
