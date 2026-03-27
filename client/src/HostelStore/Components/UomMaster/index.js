import React, { useEffect, useState, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";

import FormHeader from "../../../Basic/components/FormHeader";
import FormReport from "../../../Basic/components/FormReportTemplate";
import { toast } from "react-toastify";
import {
  TextInput,
  CheckBox,
  ReusableTable,
  ToggleButton,
  TextInputNew,
} from "../../../Inputs";
import ReportTemplate from "../../../Basic/components/ReportTemplate";
import {
  useGetUomQuery,
  useGetUomByIdQuery,
  useAddUomMutation,
  useUpdateUomMutation,
  useDeleteUomMutation,
  useLazyGetUomByIdQuery,
} from "../../../redux/services/UomMasterService.js";
import { Check, Power } from "lucide-react";
import Modal from "../../../UiComponents/Modal/index.js";
import { statusDropdown } from "../../../Utils/DropdownData.js";
import Swal from "sweetalert2";

const MODEL = "Uom Master";

export default function Form() {
  const [form, setForm] = useState(false);

  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  // const [code, setCode] = useState("");
  const [active, setActive] = useState(true);

  const [searchValue, setSearchValue] = useState("");

  const childRecord = useRef(0);

  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };

  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetUomQuery({ params, searchParams: searchValue });
  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetUomByIdQuery(id, { skip: !id });
  const [trigger, { data: LazyData }] = useLazyGetUomByIdQuery();

  const [addData] = useAddUomMutation();
  const [updateData] = useUpdateUomMutation();
  const [removeData] = useDeleteUomMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      // if (id) setReadOnly(true);
      setName(data?.name ? data.name : "");
      // setCode(data?.code ? data.code : "");
      setActive(id ? (data?.active ? data.active : false) : true);
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
    },
    [id],
  );
  useEffect(() => {
    syncFormWithDb(singleData?.data);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);
  const data = {
    name,
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
    active,
    id,
  };
  const validateData = (data) => {
    if (data.name) {
      return true;
    }
    return false;
  };
  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      let returnData = await callback(data).unwrap();
      if (returnData.statusCode === 0) {
        setId("");
        syncFormWithDb(undefined);

        if (nextProcess == "new") {
          syncFormWithDb(undefined);
          onNew();
          countryNameRef?.current?.focus();
        } else {
          setForm(false);
        }
        Swal.fire({
          title: text + "  " + "Successfully",
          icon: "success",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission error",
          text: returnData.data?.message || "Something went wrong!",
        });
      }
    } catch (error) {
      console.log("handle");
    }
  };

  const saveData = (nextProcess) => {
    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "error",
      });
      return;
    }
    let foundItem;
    if (id) {
      foundItem = allData?.data
        ?.filter((i) => i.id != id)
        ?.some((item) => item.name === name);
    } else {
      foundItem = allData?.data?.some((item) => item.name === name);
    }

    if (foundItem) {
      Swal.fire({
        title: "The Uom Name already exists.",
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
    const { data } = await trigger(id);

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
      if (data?.data?.childRecord > 0) {
        Swal.fire({
          icon: "error",
          title: "Child record Exists",
          text: "Data cannot be deleted!",
        });
      } else {
        try {
          let returnData = await removeData(id).unwrap();
          if (returnData.statusCode === 0) {
            setId("");
            syncFormWithDb(undefined);
            Swal.fire({
              title: "Deleted Successfully",
              icon: "success",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: returnData?.message || "Something went wrong!",
            });
          }
        } catch (error) {
          toast.error("something went wrong");
        }
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
  };

  function onDataClick(id) {
    setId(id);
    setForm(true);
  }
  const tableHeaders = ["Name", "Status"];
  const tableDataNames = ["dataObj.name", "dataObj.active ? ACTIVE : INACTIVE"];
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
      header: "Uom",
      accessor: (item) => item?.name,
      //   cellClass: () => "font-medium  text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-48",
    },

    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  const countryNameRef = useRef(null);

  useEffect(() => {
    if (form && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form]);
  // if (!form)
  //     return <ReportTemplate
  //         heading={MODEL}
  //         tableHeaders={tableHeaders}
  //         tableDataNames={tableDataNames}
  //         loading={
  //             isLoading || isFetching
  //         }
  //         setForm={setForm}
  //         data={allData?.data}
  //         onClick={onDataClick}
  //         onNew={onNew}
  //         searchValue={searchValue}
  //         setSearchValue={setSearchValue}
  //     />

  return (
    // <div onKeyDown={handleKeyDown} className='md:items-start md:justify-items-center grid h-full bg-theme'>
    //     <div className='flex flex-col frame w-full h-full'>
    //         <FormHeader
    //             onNew={onNew}
    //             onClose={() => {
    //                 setForm(false);
    //                 setSearchValue("");
    //             }} model={MODEL}
    //             saveData={saveData}
    //             setReadOnly={setReadOnly}
    //             deleteData={deleteData}
    //         // childRecord={childRecord.current}
    //         />
    //         <div className='flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-2 overflow-clip'>
    //             <div className='col-span-3 grid md:grid-cols-2 border overflow-auto'>
    //                 <div className='mr-1 md:ml-2'>
    //                     <fieldset className='frame my-1'>
    //                         <legend className='sub-heading'>UOM Info</legend>
    //                         <div className='grid grid-cols-1 my-2'>
    //                             <TextInput name="UOM Type" type="text" value={name} setValue={setName} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
    //                             <CheckBox name="Active" value={active} setValue={setActive} readOnly={readOnly} />
    //                         </div>
    //                     </fieldset>
    //                 </div>
    //             </div>
    //             <div className='frame overflow-x-hidden'>
    //                 <FormReport
    //                     searchValue={searchValue}
    //                     setSearchValue={setSearchValue}
    //                     setId={setId}
    //                     tableHeaders={tableHeaders}
    //                     tableDataNames={tableDataNames}
    //                     data={allData?.data}
    //                     loading={
    //                         isLoading || isFetching
    //                     }
    //                 />
    //             </div>
    //         </div>
    //     </div>
    // </div>
    <div onKeyDown={handleKeyDown} className="p-1">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-lg font-bold text-gray-800">
          Unit Of Mesaurement Master
        </h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
              syncFormWithDb(undefined);
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-sm px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New Unit Of Mesaurement
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
          itemsPerPage={10}
        />
      </div>

      <div>
        {form === true && (
          <Modal
            isOpen={form}
            form={form}
            widthClass={"w-[40%] h-[50%]"}
            onClose={() => {
              setForm(false);
              // setErrors({});
            }}
          >
            <div className="h-full flex flex-col bg-gray-200 ">
              <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg px-2 py-0.5 font-semibold  text-gray-800">
                    {id
                      ? !readOnly
                        ? "Edit Unit Of Mesaurement"
                        : "Unit Of Mesaurement Master"
                      : "Add New Unit Of Mesaurement  "}
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
                  <div className="lg:col-span-2 space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
                      <div className="space-y-4 ">
                        <div className="grid grid-cols-2  gap-3  h-full">
                          <fieldset className="">
                            <div className="mb-5">
                              <TextInputNew
                                name="Uom Name"
                                type="text"
                                value={name}
                                setValue={setName}
                                required={true}
                                readOnly={readOnly}
                                disabled={childRecord.current > 0}
                                ref={countryNameRef}
                              />
                            </div>
                            <div>
                              <ToggleButton
                                name="Status"
                                options={statusDropdown}
                                value={active}
                                setActive={setActive}
                                required={true}
                                readOnly={readOnly}
                                disabled={childRecord.current > 0}
                              />
                            </div>
                          </fieldset>
                        </div>
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
