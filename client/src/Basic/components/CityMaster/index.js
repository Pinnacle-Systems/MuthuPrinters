import React, { useEffect, useState, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";
import {
  useGetCityQuery,
  useGetCityByIdQuery,
  useAddCityMutation,
  useUpdateCityMutation,
  useDeleteCityMutation,
} from "../../../redux/services/CityMasterService";
import { useGetStateQuery } from "../../../redux/services/StateMasterService";

import FormHeader from "../FormHeader";
import FormReport from "../FormReportTemplate";
import { toast } from "react-toastify";
import {
  TextInput,
  CheckBox,
  DropdownInput,
  DisabledInput,
  ReusableTable,
  ToggleButton,
  TextInputNew,
  DropdownInputNew,
  TextInputNew1,
} from "../../../Inputs";
import ReportTemplate from "../ReportTemplate";
import { dropDownListObject } from "../../../Utils/contructObject";
import Loader from "../Loader";
import { useDispatch } from "react-redux";
import { Check, Power } from "lucide-react";
import Modal from "../../../UiComponents/Modal";
import { statusDropdown } from "../../../Utils/DropdownData";
import Swal from "sweetalert2";

const MODEL = "City Master";

export default function Form() {
  const [form, setForm] = useState(false);

  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [state, setState] = useState("");

  const [searchValue, setSearchValue] = useState("");

  const childRecord = useRef(0);
  const dispatch = useDispatch();

  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };
  const {
    data: stateList,
    isLoading: isStateLoading,
    isFetching: isStateFetching,
  } = useGetStateQuery({ params }, { skip: !form });
  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetCityQuery({ params, searchParams: searchValue });

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetCityByIdQuery(id, { skip: !id });

  const [addData] = useAddCityMutation();
  const [updateData] = useUpdateCityMutation();
  const [removeData] = useDeleteCityMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      // if (id) setReadOnly(true);
      setName(data?.name ? data.name : "");
      setCode(data?.code ? data.code : "");
      setActive(id ? (data?.active ? data.active : false) : true);
      setState(data?.stateId ? data.stateId : "");
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
    },
    [id],
  );

  useEffect(() => {
    syncFormWithDb(singleData?.data);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const data = {
    name,
    code,
    active,
    state,
    id,
  };

  const validateData = (data) => {
    if (data.name && data?.state) {
      return true;
    }
    return false;
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      let returnData = await callback(data).unwrap();
      setId(returnData.data.id);

      if (nextProcess == "new") {
        syncFormWithDb(undefined);
        onNew();
        countryNameRef?.current?.focus();
      } else {
        setForm(false);
      }
      Swal.fire({
        title: text + "Successfully",
        icon: "success",
      });
      dispatch({
        type: `StateMaster/invalidateTags`,
        payload: ["State"],
      });
    } catch (error) {
      console.log("handle");
    }
  };

  const saveData = (nextProcess) => {
    let foundItem;
    if (id) {
      foundItem = allData?.data
        ?.filter((i) => i.id !== id)
        ?.some(
          (item) =>
            item.name?.trim().toLowerCase() == name?.trim().toLowerCase() &&
            item.stateId == state,
        );
    } else {
      foundItem = allData?.data?.some(
        (item) =>
          item.name?.trim().toLowerCase() == name?.trim().toLowerCase() &&
          item.stateId == state,
      );
    }

    console.log(allData?.data, "alldata");

    if (foundItem) {
      Swal.fire({
        text: "The City Name already exists.",
        icon: "warning",
        timer: 1500,
        showConfirmButton: false,
      });
      return false;
    }
    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "error",
      });
      return;
    }
    if (!window.confirm("Are you sure save the details ...?")) {
      return;
    }
    if (id) {
      handleSubmitCustom(updateData, data, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, data, "Added", nextProcess);
    }
  };

  const deleteData = async (id, childRecord) => {
    if (childRecord) {
      Swal.fire({
        icon: "error",
        title: "Child record Exists",
      });
      return;
    }
    if (id) {
      if (!window.confirm("Are you sure to delete...?")) {
        return;
      }
      try {
        await removeData(id);
        setId("");
        dispatch({
          type: `countryMaster/invalidateTags`,
          payload: ["Countries"],
        });
        // toast.success("Deleted Successfully");
        Swal.fire({
          title: "Deleted Successfully",
          icon: "success",
        });
        setForm(false);
      } catch (error) {
        toast.error("something went wrong");
      }
    }
  };

  const handleKeyDown = (event) => {
    let charCode = String.fromCharCode(event.which).toLowerCase();
    if ((event.ctrlKey || event.metaKey) && charCode === "s") {
      event.preventDefault();
      saveData();
    }
  };

  const onNew = () => {
    setId("");
    setReadOnly(false);
    setForm(true);
    setSearchValue("");
    syncFormWithDb(undefined);
  };

  function onDataClick(id) {
    setId(id);
    setForm(true);
  }
  const tableHeaders = ["City Name", "Code", "State", "Status"];
  const tableDataNames = [
    "dataObj.code",
    "dataObj.name",
    "dataObj.state.name",
    "dataObj.active ? ACTIVE : INACTIVE",
  ];

  const handleView = (id) => {
    setId(id);
    setForm(true);
    setReadOnly(true);
    console.log("view");
  };
  const handleEdit = (id) => {
    setId(id);
    setForm(true);
    setReadOnly(false);
    console.log("Edit");
  };

  const ACTIVE = (
    <div className="bg-gradient-to-r from-green-200 to-green-500 inline-flex items-center justify-center rounded-full border-2 w-6 border-green-500 shadow-lg text-white hover:scale-110 transition-transform duration-300">
      <Power size={10} />
    </div>
  );

  const INACTIVE = (
    <div className="bg-gradient-to-r from-red-200 to-red-500 inline-flex items-center justify-center rounded-full border-2 w-6 border-red-500 shadow-lg text-white hover:scale-110 transition-transform duration-300">
      <Power size={10} />
    </div>
  );

  const columns = [
    {
      header: "S.No",
      accessor: (item, index) => index + 1,
      className: "font-medium text-gray-900 w-12  text-center",
    },
    {
      header: "City Name",
      accessor: (item) => item?.name,
      className: "font-medium text-gray-900 text-left uppercase w-64",
    },
    {
      header: "State Name",
      accessor: (item) => item?.state?.name,
      className: "font-medium text-gray-900 text-left uppercase w-64",
    },
    {
      header: "Country Name",
      accessor: (item) => item?.state?.country?.name,
      className: "font-medium text-gray-900 text-left uppercase w-64",
    },

    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  // if (!form)
  //     return (
  //         <ReportTemplate
  //             heading={MODEL}
  //             tableHeaders={tableHeaders}
  //             tableDataNames={tableDataNames}
  //             loading={
  //                 isLoading || isFetching
  //             }
  //             setForm={setForm}
  //             data={allData?.data}
  //             onClick={onDataClick}
  //             onNew={onNew}
  //             searchValue={searchValue}
  //             setSearchValue={setSearchValue}
  //         />
  //     );
  function countryFromState() {
    return state
      ? stateList?.data?.find((item) => item.id === parseInt(state)).country
          ?.name
      : "";
  }

  const countryNameRef = useRef(null);

  useEffect(() => {
    if (form && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form]);
  return (
    <div onKeyDown={handleKeyDown} className="p-1 ">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-2xl font-bold text-gray-800">City Master</h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-sm px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New City
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-3">
        <ReusableTable
          columns={columns}
          data={allData?.data}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={deleteData}
          itemsPerPage={15}
        />
      </div>

      <div>
        {form === true && (
          <Modal
            isOpen={form}
            form={form}
            widthClass={"w-[40%] h-[350px]"}
            onClose={() => {
              setForm(false);
            }}
          >
            <div className="h-full flex flex-col bg-gray-200 ">
              <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg px-2 py-0.5 font-semibold  text-gray-800">
                    {id
                      ? !readOnly
                        ? "Edit City Master"
                        : "City Master"
                      : "Add New City "}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <div>
                    {readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm(false);
                          setSearchValue("");
                          setId(false);
                        }}
                        className="px-3 py-1 text-red-600 hover:bg-red-600 hover:text-white border border-red-600 text-xs rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          saveData("close");
                        }}
                        className="px-3 py-1 hover:bg-blue-600 hover:text-white rounded text-blue-600 
                  border border-blue-600 flex items-center gap-1 text-xs"
                      >
                        <Check size={14} />
                        {id ? "Update" : "Save & close"}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!readOnly && !id && (
                      <button
                        type="button"
                        onClick={() => {
                          saveData("new");
                        }}
                        className="px-3 py-1 hover:bg-green-600 hover:text-white rounded text-green-600 
                  border border-green-600 flex items-center gap-1 text-xs"
                      >
                        <Check size={14} />
                        {"Save & New"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3 ">
                <div className="grid grid-cols-1  gap-3  h-full ">
                  <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
                    <div className="grid grid-cols-2  gap-3 ">
                      <div className="">
                        <TextInputNew1
                          ref={countryNameRef}
                          name="City Name"
                          type="text"
                          value={name}
                          setValue={setName}
                          required={true}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                        />
                      </div>
                      <div className="">
                        <TextInputNew1
                          name="Code"
                          type="text"
                          value={code}
                          setValue={setCode}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                        />
                      </div>

                      <div className=" ">
                        <DropdownInputNew
                          name="State"
                          options={
                            Array.isArray(stateList?.data)
                              ? dropDownListObject(
                                  id
                                    ? stateList?.data
                                    : stateList?.data?.filter(
                                        (item) => item?.active,
                                      ),
                                  "name",
                                  "id",
                                )
                              : []
                          }
                          value={state}
                          setValue={setState}
                          required={true}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                        />
                      </div>
                      <div className="">
                        <TextInputNew1
                          name="Country"
                          type="text"
                          value={countryFromState()}
                          disabled={true}
                        />
                      </div>

                      <div className="">
                        <ToggleButton
                          name="Status"
                          options={statusDropdown}
                          value={active}
                          setActive={setActive}
                          required={true}
                          readOnly={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
