import React, { useEffect, useState, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";
import {
  useGetTaxTemplateQuery,
  useGetTaxTemplateByIdQuery,
  useAddTaxTemplateMutation,
  useUpdateTaxTemplateMutation,
  useDeleteTaxTemplateMutation,
  useLazyGetTaxTemplateByIdQuery,
} from "../../../redux/services/TaxTemplateServices";
import FormHeader from "../../../Basic/components/FormHeader";
import FormReport from "../../../Basic/components/FormReportTemplate";
import { toast } from "react-toastify";
import ReportTemplate from "../../../Basic/components/ReportTemplate";
import TaxTemplateGrid from "./TaxTemplateGrid";
import {
  TextInput,
  CheckBox,
  ReusableTable,
  ToggleButton,
} from "../../../Inputs";
import { useDispatch } from "react-redux";
import Modal from "../../../UiComponents/Modal";
import { Check, Power } from "lucide-react";
import Swal from "sweetalert2";
import { statusDropdown } from "../../../Utils/DropdownData";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags.js";

const MODEL = "Tax Template Master";

export default function Form() {
  const [form, setForm] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState("");

  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [taxTemplateDetails, setTaxTemplateDetails] = useState([]);

  const [searchValue, setSearchValue] = useState("");
  const [dispatchInvalidate] = useInvalidateTags();

  const childRecord = useRef(0);
  const dispatch = useDispatch();

  const companyId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "userCompanyId",
  );
  const userId = secureLocalStorage.getItem(
    sessionStorage.getItem("sessionId") + "userId",
  );
  const params = {
    companyId,
  };

  const countryNameRef = useRef(null);

  useEffect(() => {
    if (form && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form]);

  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetTaxTemplateQuery({ params, searchParams: searchValue });

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetTaxTemplateByIdQuery(id, { skip: !id });
  const [trigger, { data: LazyData }] = useLazyGetTaxTemplateByIdQuery();
  const [addData] = useAddTaxTemplateMutation();
  const [updateData] = useUpdateTaxTemplateMutation();
  const [removeData] = useDeleteTaxTemplateMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      setName(data ? data?.name : "");
      setTaxTemplateDetails(data ? data?.TaxTemplateDetails : []);
      setActive(id ? (data?.active ? data.active : false) : true);
      childRecord.current = data?.childRecord ? data?.childRecord : 0;
    },
    [id],
  );

  useEffect(() => {
    if (id) {
      syncFormWithDb(singleData?.data);
    } else {
      syncFormWithDb(undefined);
    }
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const data = {
    name,
    active,
    companyId,
    id,
    userId,
    taxTemplateDetails: taxTemplateDetails.filter((temp) => temp.taxTermId),
  };

  const validateData = (data) => {
    return data.taxTemplateDetails && data.name;
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      let returnData;
      if (text === "Updated") {
        returnData = await callback({ id, body: data }).unwrap();
      } else {
        returnData = await callback(data).unwrap();
      }

      if (nextProcess == "new") {
        syncFormWithDb(undefined);
        onNew();
        countryNameRef?.current?.focus();
      } else {
        setForm(false);
                        syncFormWithDb(undefined);

      }
      Swal.fire({
        title: text + "  " + "Successfully",
        icon: "success",
        // draggable: true,
        // timer: 1000,
        // showConfirmButton: false,
        // didOpen: () => {
        //     Swal.showLoading();
        // }
      });
      dispatchInvalidate();
    } catch (error) {
      console.log("handle");
    }
  };

  const saveData = (nextProcess) => {
    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "success",
         didClose: () => {          countryNameRef?.current?.focus();
        }
        // draggable: true,
        // timer: 1000,
        // showConfirmButton: false,
        // didOpen: () => {
        //     Swal.showLoading();
        // }
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
        text: "The Tax Template Name already exists.",
        icon: "warning",
         didClose: () => {          countryNameRef?.current?.focus();
        }
      });
      return false;
    }
    if(id){

      if (!window.confirm("Are you sure update the details ...?")) {
        return;
      }
    }
    if (id) {
      handleSubmitCustom(updateData, data, "Updated", nextProcess);
    } else {
      handleSubmitCustom(addData, data, "Added", nextProcess);
    }
  };

  const deleteData = async (id) => {
    const { data } = await trigger(id);

    if (id) {
      if (!window.confirm("Are you sure to delete...?")) {
        return;
      }
      if (data?.data?.childRecord > 0) {
        Swal.fire({
          icon: "error",
          title: "Child Record Exist",
          text: "Data cannot be deleted!",
        });
      } else {
        try {
          await removeData(id);
          setId("");
          dispatchInvalidate();
          onNew();
          setForm(false);
          Swal.fire({
            title: "Deleted" + "  " + "Successfully",
            icon: "success",
            // draggable: true,
            // timer: 1000,
            // showConfirmButton: false,
            // didOpen: () => {
            //     Swal.showLoading();
            // }
          });
                          syncFormWithDb(undefined);

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
    setForm(true);
    setSearchValue("");
    setReadOnly(false);
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
      header: "Template Name",
      accessor: (item) => item?.name,
      //   cellClass: () => "font-medium  text-gray-900",
      className: "font-medium text-gray-900 text-left uppercase w-72",
    },
    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  const handleView = (id) => {
    setId(id);
    setForm(true);
    setReadOnly(true);
    console.log("view");
  };
  const handleEdit = (id) => {
    console.log("Edit");
    setReadOnly(false);
    setId(id);
    setForm(true);
  };

  return (
    // <div
    //     onKeyDown={handleKeyDown}
    //     className="md:items-start md:justify-items-center grid h-full bg-theme"
    // >
    //     <div className="flex flex-col frame w-full h-full">
    //         <FormHeader
    //             onNew={onNew}
    //             onClose={() => {
    //                 setForm(false);
    //                 setSearchValue("");
    //             }}
    //             model={MODEL}
    //             saveData={saveData}
    //             setReadOnly={setReadOnly}
    //             deleteData={deleteData}
    //         // childRecord={childRecord.current}
    //         />
    //         <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-2 overflow-clip">
    //             <div className="col-span-3 grid md:grid-cols-2 border overflow-auto">
    //                 <div className='col-span-3 mr-1 md:ml-5'>
    //                     <fieldset className='frame my-1 rounded-tr-lg rounded-bl-lg rounded-br-lg border border-gray-600'>
    //                         <legend className='sub-heading'>Tax Template Info</legend>
    //                         <div className='grid grid-cols-1 my-2'>
    //                             <TextInput name="Template Name" type="text" value={name} setValue={setName} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
    //                             <CheckBox name="Active" readOnly={readOnly} value={active} setValue={setActive} />
    //                         </div>
    //                     </fieldset>
    //                     <fieldset className='frame rounded-tr-lg rounded-bl-lg rounded-br-lg my-5 w-full flex h-[400px] overflow-auto border border-gray-600'>
    //                         <legend className='sub-heading'>Tax Template Details</legend>
    //                         <TaxTemplateGrid params={params} taxTemplateItems={taxTemplateDetails} setTaxTemplateItems={setTaxTemplateDetails} readOnly={readOnly} />
    //                     </fieldset>
    //                 </div>
    //             </div>
    //             <div className="frame overflow-x-hidden">
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
    <div onKeyDown={handleKeyDown} className="p-1 h-[87%]">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-lg font-bold text-gray-800">Tax Template Master</h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-sm px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New Tax Template
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-3 ">
        <ReusableTable
          columns={columns}
          data={allData?.data}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={deleteData}
          itemsPerPage={15}
          setReadOnly={setReadOnly}
        />
      </div>

      <div>
        {form === true && (
          <Modal
            isOpen={form}
            form={form}
            widthClass={"w-[90%] h-[500px]"}
            onClose={() => {
              setForm(false);
              syncFormWithDb(undefined);
              setId("");
            }}
          >
            <div className="h-full flex flex-col bg-gray-200">
              <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg px-2 py-0.5 font-semibold  text-gray-800">
                    {id
                      ? !readOnly
                        ? " Tax Template "
                        : " Tax Template "
                      : "Add New Tax Template "}
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

              <div className="flex-1 overflow-auto p-3">
                <div className="grid grid-cols-1  gap-3  h-full">
                  <div className="lg:col-span- space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
                      <div className="space-y-4 ">
                        <fieldset className=" my-1 rounded-tr-lg rounded-bl-lg rounded-br-lg border border-gray-200">
                          <legend className="">Tax Template Info</legend>
                          <div className="grid grid-cols-4 my-2 p-2">
                            <TextInput
                              name="Template Name"
                              type="text"
                              value={name}
                              setValue={setName}
                              required={true}
                              readOnly={readOnly}
                              disabled={childRecord.current > 0}
                              ref={countryNameRef}
                            />
                          </div>
                          <ToggleButton
                            name="Status"
                            options={statusDropdown}
                            value={active}
                            setActive={setActive}
                            required={true}
                            readOnly={readOnly}
                          />
                        </fieldset>
                        <fieldset className=" rounded-tr-lg rounded-bl-lg rounded-br-lg my-5 w-full flex h-[300px] overflow-auto border border-gray-200">
                          <legend className="sub-heading">
                            Tax Template Details
                          </legend>
                          <TaxTemplateGrid
                            params={params}
                            taxTemplateItems={taxTemplateDetails}
                            setTaxTemplateItems={setTaxTemplateDetails}
                            readOnly={readOnly || childRecord.current > 0}
                          />
                        </fieldset>
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
