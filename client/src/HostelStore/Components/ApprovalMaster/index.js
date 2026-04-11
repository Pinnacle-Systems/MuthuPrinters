import React, { useEffect, useState, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";
import { useGetCountriesQuery } from "../../../redux/services/CountryMasterService";
import { toast } from "react-toastify";
import {
  ReusableTable,
  ToggleButton,
  TextInputNew,
  DropdownInputNew,
  TextInputNew1,
  DropdownInput,
  DropdownNew,
} from "../../../Inputs";
import { dropDownListObject } from "../../../Utils/contructObject";
import { useDispatch } from "react-redux";
import { Check, Power } from "lucide-react";
import Modal from "../../../UiComponents/Modal";
import Swal from "sweetalert2";
import { CountryMaster } from "..";
import { DropdownWithModal } from "../../../Inputs/Reuseable";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags";
import { useFormKeyboardNavigation } from "../../../CustomHooks/useFormKeyboardNavigation";
import { useGetPagesQuery } from "../../../redux/services/PageMasterService";
import {
  useAddApprovalMutation,
  useDeleteApprovalMutation,
  useGetApprovalByIdQuery,
  useGetApprovalQuery,
  useUpdateApprovalMutation,
} from "../../../redux/uniformService/ApprovalMasterServices";
import { useGetRolesQuery } from "../../../redux/services/RolesMasterService";
import { useGetUserQuery } from "../../../redux/services/UsersMasterService";
import ApprovalDetails from "./ApprovalDetails";
import { getCommonParams } from "../../../Utils/helper";

export default function Form({
  onSuccess,
  onClose,
  editId,
  deleteId,
  deleteLabel,
} = {}) {
  const [form, setForm] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState(editId || deleteId || "");
  const [pageId, setPageId] = useState("");
  const [active, setActive] = useState(true);
  const [approvalLevelItems, setApprovalLevelItems] = useState([]);
  const childRecord = useRef(0);
  const dispatch = useDispatch();
  const [dispatchInvalidate] = useInvalidateTags();
  const { refs, handlers, focusFirstInput } = useFormKeyboardNavigation();
  const { branchId } = getCommonParams();
  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };
  const {
    data: pageList,
    isLoading: isPageLoading,
    isFetching: isPageFetching,
  } = useGetPagesQuery({ params });

  const {
    data: roleList,
    isLoading: isRoleLoading,
    isFetching: isRoleFetching,
  } = useGetRolesQuery({ params });

  const {
    data: userList,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useGetUserQuery({ params });

  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetApprovalQuery({ params });

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetApprovalByIdQuery(id, { skip: !id });

  const [addData] = useAddApprovalMutation();
  const [updateData] = useUpdateApprovalMutation();
  const [removeData] = useDeleteApprovalMutation();

  const syncFormWithDb = useCallback((data) => {
    setPageId(data?.pageId || "");
    setActive(data?.active ?? true);

    let levels = (data?.approvalLevels || []).map((lvl, i) => ({
      levelNo: lvl.levelNo || i + 1,
      approveType: lvl.approveType || "OR", // ✅ NOW WORKS
      condition: lvl.condition || "",
      users:
        lvl.LevelUsers?.map((u) => ({
          label: u.User?.username,
          value: u.userId,
        })) || [],
    }));

    // ✅ Ensure minimum 4 rows
    if (levels.length < 4) {
      const extra = Array.from({ length: 4 - levels.length }, (_, i) => ({
        levelNo: levels.length + i + 1,
        approveType: "OR",
        condition: "",
        users: [],
      }));
      levels = [...levels, ...extra];
    }

    setApprovalLevelItems(levels);

    childRecord.current = data?.childRecord || 0;
  }, []);

  useEffect(() => {
    syncFormWithDb(singleData?.data);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const data = {
    pageId,
    active,
    id,
    approvalLevelItems: approvalLevelItems?.filter(
      (item) => item.users.length > 0,
    ),
    branchId,
  };

  const validateData = (data) => {
    if (data.pageId && data.approvalLevelItems.length > 0) {
      return true;
    }
    return false;
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      let returnData = await callback(data).unwrap();
      setId(returnData.data.id);
      if (onSuccess) {
        await Swal.fire({
          title: text + "  " + "Successfully",
          icon: "success",
        });
        onSuccess(returnData.data.id);
        return;
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
        title: text + "Successfully",
        icon: "success",
      });
      dispatchInvalidate();
    } catch (error) {
      console.log(error);
      console.log("handle");
    }
  };

  const saveData = (nextProcess) => {
    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "success",
        didClose: () => {
          countryNameRef?.current?.focus();
        },
      });
      return;
    }

    let foundItem;
    if (id) {
      foundItem = allData?.data
        ?.filter((i) => i.id != id)
        ?.some((item) => item.pageId == pageId);
    } else {
      foundItem = allData?.data?.some((item) => item.pageId == pageId);
    }
    if (foundItem) {
      Swal.fire({
        text: "The Approval Config already exists.",
        icon: "warning",
        didClose: () => {
          countryNameRef?.current?.focus();
        },
      });
      return false;
    }
    if (id) {
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
    if (id) {
      if (!window.confirm("Are you sure to delete...?")) {
        return;
      }
      try {
        let deldata = await removeData(id).unwrap();
        if (deldata?.statusCode == 1) {
          Swal.fire({
            icon: "error",
            // title: 'Submission error',
            text: deldata?.message || "Something went wrong!",
          });
          return;
        }
        setId("");
        Swal.fire({
          title: "Deleted Successfully",
          icon: "success",
        });
        setForm(false);
        dispatchInvalidate();
        syncFormWithDb(undefined);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Submission error",
          text: error.data?.message || "Something went wrong!",
        });
        setForm(false);
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
    syncFormWithDb(undefined);
  };

  function onDataClick(id) {
    setId(id);
    setForm(true);
  }

  const handleView = (id) => {
    setId(id);
    setForm(true);
    setReadOnly(true);
  };
  const handleEdit = (id) => {
    setId(id);
    setForm(true);
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
      header: "Page Name",
      accessor: (item) => item?.Page?.name,
      //   cellClass: () => "font-medium  text-gray-900",
      className: "font-medium text-gray-900 text-left uppercase w-64",
    },

    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  const {
    firstInputRef: countryNameRef,
    toggleButtonRef,
    saveCloseButtonRef,
    saveNewButtonRef,
  } = refs;

  // const countryNameRef = useRef(null);

  useEffect(() => {
    if ((form || onSuccess) && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form, onSuccess]);

  const formBody = (
    <div className="flex-1 p-3">
      <div className="grid grid-cols-1  gap-3  h-full ">
        <div className="bg-white p-3 rounded-md border border-gray-200 h-full">
          <fieldset className="grid grid-cols-1 gap-2 rounded mt-2">
            <div className="w-60 ">
              <DropdownNew
                name="Transaction Name"
                dataList={
                  id
                    ? pageList?.data
                    : pageList?.data?.filter((item) => item?.active)
                }
                value={pageId}
                setValue={setPageId}
                required={true}
                readOnly={readOnly}
                disabled={childRecord.current > 0}
                ref={countryNameRef}
              />
            </div>
            <div className="flex h-[260px] overflow-auto">
              <ApprovalDetails
                approvalLevelItems={approvalLevelItems}
                setApprovalLevelItems={setApprovalLevelItems}
                userList={userList?.data}
                roleList={roleList?.data}
                readOnly={readOnly || childRecord.current > 0}
              />
            </div>
            <div data-skip-focus="true" className="mt-2">
              <ToggleButton
                name="Status"
                value={active}
                setActive={setActive}
                required={true}
                readOnly={readOnly}
                onKeyDown={handlers.handleToggleKeyDown}
                ref={toggleButtonRef}
              />
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );

  if (deleteId) {
    const childCount = singleData?.data?.childRecord ?? 0;
    const isLoadingRecord = isSingleFetching || isSingleLoading;

    const handleConfirmDelete = async () => {
      try {
        const res = await removeData(deleteId).unwrap();
        if (res?.statusCode === 1) {
          toast.error(res?.data?.message || "Cannot delete");
          return;
        }
        toast.success("Approval Config deleted successfully");
        onSuccess?.();
      } catch (err) {
        toast.error(err?.data?.message || "Failed to delete Approval Config");
      }
    };

    return (
      <div className="min-h-[250px] flex flex-col bg-gray-200">
        <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center bg-white">
          <h2 className="text-lg font-semibold">Delete Approval Config</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-white mx-3 mt-3 rounded mb-3">
          {isLoadingRecord ? (
            <p>Checking...</p>
          ) : childCount > 0 ? (
            <>
              <p className="text-red-600 font-semibold">
                Cannot delete "{deleteLabel}"
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs border border-gray-400 text-gray-600 hover:bg-gray-100 rounded"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <p>Are you sure delete "{deleteLabel}"?</p>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs border border-gray-400 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (onSuccess) {
    return (
      <div
        onKeyDown={handleKeyDown}
        className="h-full flex flex-col bg-gray-200"
      >
        <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
          <h2 className="text-lg px-2 py-0.5 font-semibold text-gray-800">
            {editId ? "Edit Approval Config" : "Add New Approval Config"}
          </h2>
          <button
            type="button"
            onClick={() => saveData("close")}
            ref={saveCloseButtonRef}
            onKeyDown={handlers.handleSaveCloseKeyDown(saveData)}
            className="px-3 py-1 hover:bg-blue-600 hover:text-white rounded text-blue-600 border border-blue-600 flex items-center gap-1 text-xs"
          >
            <Check size={14} />
            {editId ? "Update" : "Save"}
          </button>
        </div>

        {formBody}
      </div>
    );
  }

  return (
    <div onKeyDown={handleKeyDown} className="p-1">
      <div className="w-full flex bg-white p-1 justify-between  items-center">
        <h5 className="text-lg font-bold text-gray-800">Approval Config</h5>
        <div className="flex items-center">
          <button
            onClick={() => {
              setForm(true);
              onNew();
            }}
            className="bg-white border  border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white text-xs px-2 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
          >
            + Add New Approval Config
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
            widthClass={"w-[60%] h-[580px]"}
            onClose={() => {
              setForm(false);
              syncFormWithDb(undefined);
              setId("");
            }}
          >
            <div className="h-full flex flex-col bg-gray-200 ">
              <div className="border-b py-2 px-4 mx-3 flex mt-4 justify-between items-center sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg px-2 py-0.5 font-semibold  text-gray-800">
                    {id
                      ? !readOnly
                        ? "Edit Approval Config"
                        : "Approval Config"
                      : "Add New Approval Config "}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <div>
                    {readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setForm(false);
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
                        ref={saveCloseButtonRef}
                        tabIndex={0} // ✅ Add tabIndex
                        onKeyDown={handlers.handleSaveCloseKeyDown(saveData)}
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
                        ref={saveNewButtonRef} // ✅ Add ref
                        tabIndex={0} // ✅ Add tabIndex
                        onKeyDown={handlers.handleSaveNewKeyDown(saveData)}
                      >
                        <Check size={14} />
                        {"Save & New"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {formBody}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
