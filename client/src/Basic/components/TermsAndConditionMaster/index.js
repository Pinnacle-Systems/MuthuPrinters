import React, { useCallback, useEffect, useRef, useState } from "react";

import secureLocalStorage from "react-secure-storage";

import { statusDropdown } from "../../../Utils/DropdownData";
import { Check, Plus, Power } from "lucide-react";

import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  useAddTermsandCondtionsMutation,
  useDeleteTermsandCondtionsMutation,
  useGetTermsandCondtionsByIdQuery,
  useGetTermsandCondtionsQuery,
  useLazyGetTermsandCondtionsByIdQuery,
  useUpdateTermsandCondtionsMutation,
} from "../../../redux/uniformService/TermsAndContionService";
import { ReusableTable, TextInputNew1, ToggleButton } from "../../../Inputs";
import Modal from "../../../UiComponents/Modal";

const MODEL = "Counts Master";

export default function Form() {
  const [form, setForm] = useState(false);

  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [description, setDescription] = useState("");
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
  } = useGetTermsandCondtionsQuery({ params, searchParams: searchValue });
  const rows = allData?.data ?? [];
  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetTermsandCondtionsByIdQuery(id, { skip: !id });
  const [trigger, { data: LazyData }] = useLazyGetTermsandCondtionsByIdQuery();

  const [addData] = useAddTermsandCondtionsMutation();
  const [updateData] = useUpdateTermsandCondtionsMutation();
  const [removeData] = useDeleteTermsandCondtionsMutation();
  const countryNameRef = useRef(null);
  useEffect(() => {
    if (form && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form]);
  const syncFormWithDb = useCallback(
    (data) => {
      if (!id) {
        setReadOnly(false);
        setName("");
        setActive(id ? data?.active : true);
        childRecord.current = data?.childRecord ? data?.childRecord : 0;
      } else {
        // setReadOnly(true);
        setName(data?.name || "");
        setActive(id ? (data?.active ?? false) : true);
        setDescription(data?.description ? data?.description : "");
        childRecord.current = data?.childRecord ? data?.childRecord : 0;
      }
    },
    [id],
  );

  useEffect(() => {
    syncFormWithDb(singleData?.data);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const data = {
    id,
    description,
    active,
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
    name,
  };

  const validateData = (data) => {
    if (data.description) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    console.log(allData, "allData");
  }, [allData]);

  const handleSubmitCustom = async (callback, data, text) => {
    try {
      let returnData = await callback(data).unwrap();
      setId(returnData.data.id);
      // toast.success(text + "Successfully");
      Swal.fire({
        title: text + "  " + "Successfully",
        icon: "success",
      });
      setForm(false);
    } catch (error) {
      console.log("handle");
    }
  };

  const saveData = () => {
    if (!validateData(data)) {
      // toast.error("Please fill all required fields...!", {
      //     position: "top-center",
      // });
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "success",
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
        text: "The Tax Term Name already exists.",
        icon: "warning",
      });
      return false;
    }
    if (!window.confirm("Are you sure save the details ...?")) {
      return;
    }
    if (id) {
      handleSubmitCustom(updateData, data, "Updated");
    } else {
      handleSubmitCustom(addData, data, "Added");
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
          title: "Child record Exists",
          text: "Data cannot be deleted!",
        });
      } else {
        try {
          let deldata = await removeData(id).unwrap();
          if (deldata?.statusCode == 1) {
            toast.error(deldata?.message);
            return;
          }
          setId("");
          // toast.success("Deleted Successfully");
          Swal.fire({
            title: "Deleted" + "  " + "Successfully",
            icon: "success",
          });
          setForm(false);
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
    syncFormWithDb(undefined);
    setReadOnly(false);
  };

  function onDataClick(id) {
    setId(id);
    setForm(true);
  }

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
      header: "Name",
      accessor: (item, index) => item?.name,
      className: "font-medium text-gray-900 w-24  text-center",
    },

    {
      header: "Terms & conditions",
      accessor: (item) => item?.description,
      //   cellClass: () => "font-medium  text-gray-900",
      className: "font-medium text-gray-900 text-left uppercase w-[400px]",
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
    setId(id);
    setForm(true);
    setReadOnly(false);
    console.log("Edit");
  };
  return (
    <div onKeyDown={handleKeyDown} className="p-1 h-[90%]">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-lg font-bold text-gray-800">
          Terms & Conditions Master
        </h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-sm px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New Terms & Conditions
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-3 ">
        <ReusableTable
          columns={columns}
          data={rows}
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
            widthClass={"w-[40%] h-[60%]"}
            onClose={() => {
              setForm(false);
              setErrors({});
            }}
          >
            <div className="h-full flex flex-col bg-gray-200">
              <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg px-2 py-0.5 font-semibold  text-gray-800">
                    {id
                      ? !readOnly
                        ? "Edit Terms & Conditions Master"
                        : "Terms & Conditions Master"
                      : "Add New Terms & Conditions"}
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
                        onClick={saveData}
                        className="px-3 py-1 hover:bg-green-600 hover:text-white rounded text-green-600 
                                  border border-green-600 flex items-center gap-1 text-xs"
                      >
                        <Check size={14} />
                        {id ? "Update" : "Save"}
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
                        <fieldset className=" rounded mt-2">
                          <div className="">
                            <div className="mb-3 w-[58%]">
                              <TextInputNew1
                                name="Terms & Condition Name"
                                type="text"
                                value={name}
                                setValue={setName}
                                required={true}
                                readOnly={readOnly}
                                disabled={childRecord.current > 0}
                                ref={countryNameRef}
                              />
                            </div>
                            <div className="mt-3 gap-x-2">
                              <label className="block text-xs font-bold text-gray-600 mt-3">
                                Description :
                              </label>
                              <textarea
                                className="w-72  h-10 overflow-auto focus:outline-none border border-gray-500 rounded p-2 text-xs"
                                value={description}
                                disabled={childRecord.current > 0 || readOnly}
                                onChange={(e) => setDescription(e.target.value)}
                              ></textarea>
                            </div>
                            <div className="mt-5">
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
