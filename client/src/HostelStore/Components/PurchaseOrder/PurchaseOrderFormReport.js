import React from "react";
import { useEffect, useState } from "react";
import { useGetPartyQuery } from "../../../redux/services/PartyMasterService";
import { Loader } from "../../../Basic/components";
import {
  findFromList,
  getCommonParams,
  getDateFromDateTimeToDisplay,
} from "../../../Utils/helper";
import { showEntries } from "../../../Utils/DropdownData";
import secureLocalStorage from "react-secure-storage";
import { useGetPoQuery } from "../../../redux/uniformService/PoServices";
import {
  pageNumberToReactPaginateIndex,
  reactPaginateIndexToPageNumber,
} from "../../../Utils/helper";
import ReactPaginate from "react-paginate";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Inbox, XCircle } from "lucide-react";
import Tooltip from "@mui/material/Tooltip";
import { useDispatch } from "react-redux";
import { push } from "../../../redux/features/opentabs";
const PurchaseOrderFormReport = ({
  onClick,
  onView,
  itemsPerPage = 10,
  onEdit,
  onDelete,
  rowActions = true,
  onCreateInward, // ⬅️ new
  onCreateCancel,
}) => {
  const branchId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "currentBranchId",
  );

  const [dataPerPage, setDataPerPage] = useState("1");
  const [serachDocNo, setSerachDocNo] = useState("");
  const [searchClientName, setSearchClientName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchDueDate, setSearchDueDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [searchPoType, setSearchPoType] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [searchProjectValue, setSearchProjectValue] = useState("");
  const [searchFollowedBy, setSearchFollowedBy] = useState("");

  const dispatch = useDispatch();

  const handleOnclick = (e) => {
    setCurrentPageNumber(reactPaginateIndexToPageNumber(e.selected));
  };
  const searchFields = {
    serachDocNo,
    searchClientName,
    searchDate,
    supplier,
    searchPoType,
    searchDueDate,
  };

  useEffect(() => {
    setCurrentPageNumber(1);
  }, [serachDocNo, searchClientName, searchDate, supplier, searchPoType]);

  const companyId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "userCompanyId",
  );
  const params = {
    branchId,
    companyId,
  };

  const {
    data: allData,
    isFetching,
    isLoading,
  } = useGetPoQuery({
    params: {
      branchId,
      ...searchFields,
      pagination: true,
      dataPerPage,
      pageNumber: currentPageNumber,
    },
  });

  useEffect(() => {
    if (allData?.totalCount) {
      setTotalCount(allData?.totalCount);
    }
  }, [allData, isLoading, isFetching]);

  const isLoadingIndicator = isLoading || isFetching;

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math?.ceil(allData?.data?.length / itemsPerPage);
  const indexOfLastItem = currentPage * parseInt(10);
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allData?.data?.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  const Pagination = () => {
    // if (totalPages <= 1) return null;

    return (
      <div className="h-10 w-full flex flex-col sm:flex-row justify-between items-center p-2 bg-white border-t border-gray-200 ">
        <div className="text-sm text-gray-600 mb-2 sm:mb-0">
          Showing {indexOfFirstItem + 1} to{" "}
          {Math.min(indexOfLastItem, allData?.data?.length)} of{" "}
          {allData?.length} entries
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaChevronLeft className="inline" />
          </button>

          {Array?.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === pageNum
                    ? "bg-indigo-800 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="px-3 py-1">...</span>
          )}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-indigo-800 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {totalPages}
            </button>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FaChevronRight className="inline" />
          </button>
        </div>
      </div>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      Pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-300",
      },
      "Partially Received": {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-300",
      },
      "Partially Cancelled": {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-300",
      },
      "Fully Received": {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-300",
      },
      "Closed (Inward + Cancelled)": {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-300",
      },
      Cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-300",
      },
      "Partially Received & Cancelled": {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-300",
      },
    };
    const c = config[status] || config["Pending"];
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div
      //   id="registrationFormReport"
      className="flex flex-col w-full h-[78Vh] overflow-auto"
    >
      <>
        <div className="h-[100vh] rounded-lg bg-[#F1F1F0] shadow-sm">
          <div className="h-[68vh]">
            <table className="">
              <thead className="bg-gray-200 text-gray-800 ">
                <tr className="">
                  <th className=" px-1 py-1.5  font-medium text-[13px]  text-gray-900  text-center  w-12">
                    <div className="">S No</div>
                  </th>

                  <th className=" px-3  font-medium text-[13px]  text-gray-900  text-center w-32">
                    <div>Po No</div>
                    {/* <input
                                            type="text"
                                            className="text-black h-5   w-full py-1.5  px-1 focus:outline-none border  border-gray-400 rounded-lg"
                                            placeholder="Search"
                                            value={serachDocNo}
                                            onChange={(e) => {
                                                setSerachDocNo(e.target.value);
                                            }}
                                        /> */}
                  </th>
                  <th className=" px-3  font-medium text-[13px]  text-gray-900  text-center w-32">
                    <div>Po Date</div>
                    {/* <input
                                            type="text"
                                            className="text-black h-5   w-full py-1.5  px-1 focus:outline-none border  border-gray-400 rounded-lg"
                                            placeholder="Search"
                                            value={searchDate}
                                            onChange={(e) => {
                                                setSearchDate(e.target.value);
                                            }}
                                        /> */}
                  </th>
                  <th className=" px-3  font-medium text-[13px]  text-gray-900  text-center w-32">
                    <div>Delivery Date</div>
                  </th>
                  <th className=" px-3  font-medium text-[13px]  text-gray-900  text-center w-40">
                    <div>Po Type</div>
                    {/* <input
                                            type="text"
                                            className="text-black h-5   w-full py-1.5  px-1 focus:outline-none border  border-gray-400 rounded-lg"
                                            placeholder="Search"
                                            value={searchDate}
                                            onChange={(e) => {
                                                setSearchDate(e.target.value);
                                            }}
                                        /> */}
                  </th>

                  <th className="w-80  px-3   font-medium text-[13px] text-gray-900  text-center ">
                    <div>Supplier</div>
                    {/* <input
                                            type="text"
                                            className="text-black h-5   w-full py-1.5  px-1 focus:outline-none border  border-gray-400 rounded-lg"
                                            placeholder="Search"
                                            value={searchClientName}
                                            onChange={(e) => {
                                                setSearchClientName(e.target.value);
                                            }}
                                        /> */}
                  </th>
                  <th
                    className=" px-3 w-64  font-medium text-[13px]  text-gray-900  text-center "
                    rowSpan={2}
                  >
                    <div>Status</div>
                  </th>
                  <th
                    className="w-14   px-3  font-medium text-[13px]  text-gray-900  text-center "
                    rowSpan={2}
                  >
                    <div>Actions</div>
                  </th>
                </tr>
                <tr className="">
                  <th className=" px-1  font-medium text-[13px] justify-end  text-gray-900  text-center  w-12">
                    <div className="h-3"></div>
                  </th>

                  <th className=" px-1 font-medium text-[13px] border  text-gray-900  text-center w-32">
                    <input
                      type="text"
                      className="text-black h-5   w-full  px-1 focus:outline-none border  border-gray-400 rounded-md"
                      placeholder="Search"
                      value={serachDocNo}
                      onChange={(e) => {
                        setSerachDocNo(e.target.value);
                      }}
                    />
                  </th>
                  <th className="  px-1 font-medium text-[13px]  text-gray-900  text-center w-32">
                    <input
                      type="text"
                      className="text-black h-5   w-full   px-1 focus:outline-none border  border-gray-400 rounded-md"
                      placeholder="Search"
                      value={searchDate}
                      onChange={(e) => {
                        setSearchDate(e.target.value);
                      }}
                    />
                  </th>
                  <th className="  px-1 font-medium text-[13px]  text-gray-900  text-center w-32">
                    <input
                      type="text"
                      className="text-black h-5   w-full   px-1 focus:outline-none border  border-gray-400 rounded-md"
                      placeholder="Search"
                      value={searchDueDate}
                      onChange={(e) => {
                        setSearchDueDate(e.target.value);
                      }}
                    />
                  </th>
                  <th className="  px-1 font-medium text-[13px]  text-gray-900  text-center w-40">
                    <input
                      type="text"
                      className="text-black h-5   w-full   px-1 focus:outline-none border  border-gray-400 rounded-md"
                      placeholder="Search"
                      value={searchPoType}
                      onChange={(e) => {
                        setSearchPoType(e.target.value);
                      }}
                    />
                  </th>
                  <th className="w-80  px-1 font-medium text-[13px]  text-gray-900  text-center ">
                    <input
                      type="text"
                      className="text-black h-5   w-full   px-1 focus:outline-none border  border-gray-400 rounded-md"
                      placeholder="Search"
                      value={supplier}
                      onChange={(e) => {
                        setSupplier(e.target.value);
                      }}
                    />
                  </th>
                  {/* <th className="w-14  px-1  font-medium text-[13px]  text-gray-900  text-center "></th>

                  <th className="w-14  px-1  font-medium text-[13px]  text-gray-900  text-center "></th> */}
                </tr>
              </thead>
              {isLoadingIndicator ? (
                <tbody>
                  <tr>
                    <td>
                      <Loader />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="border-2">
                  {(allData?.data ? allData?.data : []).map(
                    (dataObj, index) => (
                      <tr
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onClick(dataObj.id);
                          }
                        }}
                        tabIndex={0}
                        key={dataObj.id}
                        className={`hover:bg-gray-50 transition-colors border-b   border-gray-200 text-[12px] ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-100"
                        }`}
                        onClick={() => dataObj.id}
                      >
                        <td className="text-center ">{index + 1}</td>

                        <td className="py-1.5 text-center">{dataObj.docId} </td>

                        <td className="py-1.5 text-left">
                          {getDateFromDateTimeToDisplay(dataObj.docDate)}
                        </td>
                        <td className="py-1.5 text-left">
                          {getDateFromDateTimeToDisplay(dataObj.dueDate)}
                        </td>
                        <td className="py-1.5 text-left  ">
                          {dataObj.poType}{" "}
                        </td>

                        <td className="py-1.5 text-left">
                          {" "}
                          {dataObj?.Supplier?.name}
                        </td>
                        <td className="py-1.5 text-center">
                          <StatusBadge status={dataObj?.status} />
                        </td>
                        {rowActions && (
                          <td className="px-2 py-1">
                            <div className="flex items-center justify-center">
                              <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
                                {/* INWARD */}
                                {onCreateInward && (
                                  <Tooltip title="Create Inward" arrow>
                                    <button
                                      disabled={[
                                        "Fully Received",
                                        "Cancelled",
                                        "Closed (Inward + Cancelled)",
                                      ].includes(dataObj.status)}
                                      onClick={() => {
                                        dispatch(
                                          push({
                                            name: "PURCHASE INWARD", // ⬅️ must match your tabs key exactly
                                            params: {
                                              supplierId: dataObj.supplierId,
                                              poId: dataObj.id,
                                              poDocId: dataObj.docId,
                                              poType: dataObj.poType,
                                              timestamp: Date.now(),
                                            },
                                          }),
                                        );
                                      }}
                                      className={`p-1.5 rounded-md transition
            ${
              [
                "Fully Received",
                "Cancelled",
                "Closed (Inward + Cancelled)",
              ].includes(dataObj.status)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
                                    >
                                      <Inbox size={16} />
                                    </button>
                                  </Tooltip>
                                )}

                                {/* CANCEL */}
                                {onCreateCancel && (
                                  <Tooltip title="Cancel PO" arrow>
                                    <button
                                      disabled={[
                                        "Fully Received",
                                        "Cancelled",
                                        "Closed (Inward + Cancelled)",
                                      ].includes(dataObj.status)}
                                      onClick={() => {
                                        dispatch(
                                          push({
                                            name: "PURCHASE CANCEL", // ⬅️ must match your tabs key exactly
                                            params: {
                                              supplierId: dataObj.supplierId,
                                              poId: dataObj.id,
                                              poDocId: dataObj.docId,
                                              poType: dataObj.poType,
                                              timestamp: Date.now(),
                                            },
                                          }),
                                        );
                                      }}
                                      className={`p-1.5 rounded-md transition
            ${
              [
                "Fully Received",
                "Cancelled",
                "Closed (Inward + Cancelled)",
              ].includes(dataObj.status)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-orange-50 text-orange-600 hover:bg-orange-100"
            }`}
                                    >
                                      <XCircle size={16} />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                              {/* LEFT GROUP */}
                              <div className="flex items-center gap-1 pl-2">
                                {onView && (
                                  <Tooltip title="View" arrow>
                                    <button
                                      className="text-blue-600  flex items-center   px-1  bg-blue-50 rounded"
                                      onClick={() => onView(dataObj.id)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path
                                          fillRule="evenodd"
                                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </Tooltip>
                                )}
                                {onEdit && (
                                  <Tooltip title="Edit" arrow>
                                    <button
                                      className="text-green-600 gap-1 px-1   bg-green-50 rounded"
                                      onClick={() => onEdit(dataObj.id)}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                  </Tooltip>
                                )}
                                {onDelete && (
                                  <Tooltip
                                    title={
                                      dataObj.childRecord > 0
                                        ? "Cannot Delete. Child Record Exists"
                                        : "Delete"
                                    }
                                    arrow
                                  >
                                    <button
                                      className={`flex items-center gap-1 px-1 rounded transition
  ${
    dataObj.childRecord > 0
      ? "bg-red-50 text-red-500 opacity-40 cursor-not-allowed"
      : "bg-red-50 text-red-800 hover:bg-red-100"
  }`}
                                      onClick={() => onDelete(dataObj.id)}
                                      disabled={dataObj.childRecord > 0}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      {/* <span className="text-xs">delete</span> */}
                                    </button>
                                  </Tooltip>
                                )}
                              </div>

                              {/* RIGHT GROUP */}
                            </div>
                          </td>
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              )}
            </table>
          </div>
          <div className="h-[10vh]">
            <Pagination />
          </div>
        </div>
      </>
    </div>
  );
};

export default PurchaseOrderFormReport;
