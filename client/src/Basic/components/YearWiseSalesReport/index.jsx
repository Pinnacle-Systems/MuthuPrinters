import React from "react";
import { useSelector } from "react-redux";
import secureLocalStorage from "react-secure-storage";
import { useGetYearWiseSalesReportQuery } from "../../../redux/services/salesReportApi";
import { getCommonParams } from "../../../Utils/helper";
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

const YearWiseSalesReport = () => {
  const { branchId } = getCommonParams();
  
  const openTabs = useSelector((state) => state.openTabs);
  const activeTab = openTabs.tabs.find((tab) => tab.active);
  const finYearId =
    activeTab?.finYearId ||
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear",
    );
  const shortCode = activeTab?.shortCode || "";

  const { data: salesReportResponse, isLoading, isFetching } = useGetYearWiseSalesReportQuery(
    { branchId },
    { skip: !branchId }
  );

  const yearWiseData = salesReportResponse?.data || [];
  
  const currentYearData = yearWiseData.find(d => d.finYearId === parseInt(finYearId));
  const totalRevenue = currentYearData?.revenue || 0;

  const barData = {
    labels: [shortCode],
    datasets: [
      {
        label: "Total Sales",
        data: [totalRevenue],
        backgroundColor: "#22c55e",
        borderRadius: 4,
        barThickness: 60,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              minimumFractionDigits: 2,
            }).format(context.raw);
          },
        },
      },
    },
    scales: {
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
    id: "topLabelsYear",
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
          } else {
            formattedValue = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value);
          }
          
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
    <div className="bg-white p-6 rounded-lg shadow w-full h-full flex flex-col min-h-[450px]">
      <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">
        Year Sales Report
      </h3>
      
      <div className="flex-1 w-full h-full relative">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading data...</p>
          </div>
        ) : (
          <Bar data={barData} options={chartOptions} plugins={[topLabelsPlugin]} />
        )}
      </div>
    </div>
  );
};

export default YearWiseSalesReport;
