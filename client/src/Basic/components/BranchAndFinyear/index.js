import React, { useEffect, useState, useCallback, useRef } from "react";
import { BRANCHES_API, FIN_YEAR_API, USERS_API } from "../../../Api";
import {
  dropDownFinYear,
  dropDownListObject,
} from "../../../Utils/contructObject";
import { getData } from "../../../Utils/Apicalls";
import secureLocalStorage from "react-secure-storage";
import { useNavigate } from "react-router-dom";
import { HOME_PATH } from "../../../Route/urlPaths";
import { toast } from "react-toastify";
import axios from "axios";
import useLogout from "../../../CustomHooks/useLogout";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const BranchAndFinYearForm = ({ setIsGlobalOpen }) => {
  useLogout();
  const branchRef = useRef(null);
  const finYearRef = useRef(null);
  const submitRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [currentFinYear, setcurrentFinYear] = useState(
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentFinYear",
    )
      ? secureLocalStorage.getItem(
          sessionStorage.getItem("sessionId") + "currentFinYear",
        )
      : "",
  );
  const [currentBranch, setCurrentBranch] = useState(
    secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "currentBranchId",
    )
      ? secureLocalStorage.getItem(
          sessionStorage.getItem("sessionId") + "currentBranchId",
        )
      : "",
  );

  const [finYears, setFinYears] = useState([]);
  const [branches, setBranches] = useState([]);

  const retrieveFinYearData = useCallback(
    () =>
      getData(FIN_YEAR_API, setFinYears, setLoading, {
        companyId: secureLocalStorage.getItem(
          sessionStorage.getItem("sessionId") + "userCompanyId",
        ),
      }),
    [],
  );
  useEffect(retrieveFinYearData, [retrieveFinYearData]);

  const retrieveBranchData = useCallback(() => {
    if (
      JSON.parse(
        secureLocalStorage.getItem(
          sessionStorage.getItem("sessionId") + "defaultAdmin",
        ),
      )
    ) {
      getData(BRANCHES_API, setBranches, setLoading, {
        active: true,
        companyId: secureLocalStorage.getItem(
          sessionStorage.getItem("sessionId") + "userCompanyId",
        ),
      });
    } else {
      axios({
        method: "get",
        url:
          BASE_URL +
          USERS_API +
          `/${secureLocalStorage.getItem(sessionStorage.getItem("sessionId") + "userId")}`,
      }).then(
        (result) => {
          if (result.status === 200) {
            if (result.data.statusCode === 0) {
              setBranches(
                result?.data?.data?.UserOnBranch.map((branch) => {
                  return {
                    branchName: branch.Branch.branchName,
                    id: branch.Branch.id,
                  };
                }),
              );
            }
          } else {
            console.log(result);
          }
        },
        (error) => {
          console.log(error);
          toast.error("Server Down", { autoClose: 5000 });
        },
      );
    }
  }, []);
  useEffect(retrieveBranchData, [retrieveBranchData]);

  const navigate = useNavigate();

  const onSubmit = () => {
    if (!(currentBranch && currentFinYear)) {
      toast.info("Select Branch and Fin. Year", { position: "top-center" });
      return;
    }
    secureLocalStorage.setItem(
      sessionStorage.getItem("sessionId") + "currentBranchId",
      currentBranch,
    );
    secureLocalStorage.setItem(
      sessionStorage.getItem("sessionId") + "currentFinYear",
      currentFinYear,
    );
    secureLocalStorage.setItem(
      sessionStorage.getItem("sessionId") + "currentFinYearActive",
      isCurrentFinYearActive(),
    );
    navigate(HOME_PATH);
    window.location.reload();
  };

  const isCurrentFinYearActive = () => {
    return finYears.find((finYr) => finYr.id === parseInt(currentFinYear))
      .active;
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 w-[400px] h-[280px]">
      <form
        className="w-full text-sm max-w-md px-6 py-8 bg-white shadow-md rounded-md"
        onKeyDown={(e) => {
          // prevent default form submit on Enter
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        {/* Branch */}
        <div className="mb-4">
          <label
            className="block mb-2 font-bold text-gray-700"
            htmlFor="branch"
          >
            Branch
          </label>
          <select
            ref={branchRef}
            className="w-full px-4 py-2 border rounded-md text-gray-700 bg-white hover:border-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-500"
            id="branch"
            name="branch"
            value={currentBranch}
            autoFocus={true}
            onChange={(e) => setCurrentBranch(e.target.value)}
            // onKeyDown={(e) => {
            //   if (e.key === "Enter") {
            //     e.preventDefault();
            //     finYearRef.current?.focus(); // move to next
            //   }
            // }}
          >
            <option value="" hidden>
              Select Branch
            </option>
            {dropDownListObject(branches, "branchName", "id").map((branch) => (
              <option key={branch.value} value={branch.value}>
                {branch.show}
              </option>
            ))}
          </select>
        </div>

        {/* Financial Year */}
        <div className="mb-4">
          <label
            className="block mb-2 font-bold text-gray-700"
            htmlFor="finyear"
          >
            Financial Year
          </label>
          <select
            // ref={finYearRef}
            className="w-full px-4 py-2 border rounded-md text-gray-700 bg-white hover:border-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-500"
            id="finyear"
            name="finyear"
            value={currentFinYear}
            onChange={(e) => setcurrentFinYear(e.target.value)}
            onBlur={() => {
              if (currentFinYear) {
                submitRef.current?.focus();
              }
            }}
          >
            <option value="" hidden>
              Select Financial Year
            </option>
            {dropDownFinYear(finYears).map((finyear) => (
              <option key={finyear.value} value={finyear.value}>
                {finyear.show}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setIsGlobalOpen(false)}
            className="px-4 py-2 mt-6 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700"
            type="button"
            tabIndex={-1}
          >
            Back
          </button>

          <button
            ref={submitRef}
            onClick={onSubmit}
            className="px-4 py-2 mt-6 font-bold text-white bg-blue-500 rounded-md hover:bg-blue-700"
            type="button"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation(); // ✅ IMPORTANT
                onSubmit();
              }
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default BranchAndFinYearForm;
