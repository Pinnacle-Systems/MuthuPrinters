import React, { useEffect, useState, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import {
  ReusableTable,
  ToggleButton,
  TextInputNew1,
  DropdownInputNew,
} from "../../../Inputs";
import { dropDownListObject } from "../../../Utils/contructObject";
import { useDispatch } from "react-redux";
import { Power } from "lucide-react";
import { FaPlus } from "react-icons/fa";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { FiEdit2, FiSave } from "react-icons/fi";
import { HiOutlineRefresh, HiX } from "react-icons/hi";
import Swal from "sweetalert2";
import useInvalidateTags from "../../../CustomHooks/useInvalidateTags";
import { useFormKeyboardNavigation } from "../../../CustomHooks/useFormKeyboardNavigation";
import {
  useAddApprovalMutation,
  useDeleteApprovalMutation,
  useGetApprovalByIdQuery,
  useGetApprovalQuery,
  useUpdateApprovalMutation,
  useGetApprovalFieldsQuery,
  useGetApprovalOperatorsQuery,
  useGetApprovalModulesQuery,
} from "../../../redux/uniformService/ApprovalMasterServices";
import { useGetRolesQuery } from "../../../redux/services/RolesMasterService";
import { useGetUserQuery } from "../../../redux/services/UsersMasterService";
import ApprovalDetails from "./ApprovalDetails";
import { getCommonParams, ModeChip } from "../../../Utils/helper";
import { invalidatePurchaseModule } from "../../../redux/Dispatch/PurchaseInvalidateTags";
import RuleBuilder from "./RuleBuilder";

const MODEL = "Approval Configuration";

export default function Form({
  onSuccess,
  onClose,
  editId,
  deleteId,
  deleteLabel,
} = {}) {
  const [form, setForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Rules, 1: Levels
  const [readOnly, setReadOnly] = useState(false);
  const [id, setId] = useState(editId || deleteId || "");
  const [moduleId, setModuleId] = useState("");
  const [active, setActive] = useState(true);
  const [approvalLevelItems, setApprovalLevelItems] = useState([]);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowPriority, setWorkflowPriority] = useState(1);
  const [ruleLogicalOperator, setRuleLogicalOperator] = useState("AND");
  const [configConditions, setConfigConditions] = useState([]);
  const childRecord = useRef(0);

  const dispatchInvalidate = useInvalidateTags()[0];
  const { refs, handlers } = useFormKeyboardNavigation();
  const { branchId } = getCommonParams();
  const params = {
    companyId: secureLocalStorage.getItem(
      sessionStorage.getItem("sessionId") + "userCompanyId",
    ),
  };

  const { data: moduleList } = useGetApprovalModulesQuery();
  const { data: roleList } = useGetRolesQuery({ params });
  const { data: userList } = useGetUserQuery({ params });
  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetApprovalQuery({ params });
  const { data: singleData } = useGetApprovalByIdQuery(id, { skip: !id });

  const [addData] = useAddApprovalMutation();
  const [updateData] = useUpdateApprovalMutation();
  const [removeData] = useDeleteApprovalMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      if (!data) {
        // Full reset for new/cleared form
        setModuleId("");
        setActive(true);
        setWorkflowName("");
        setWorkflowPriority(1);
        setRuleLogicalOperator("AND");
        setConfigConditions([]);
        setApprovalLevelItems(
          Array.from({ length: 4 }, (_, i) => ({
            levelNo: i + 1,
            approveType: "OR",
            condition: "",
            users: [],
          })),
        );
        childRecord.current = 0;
        return;
      }

      setModuleId(data?.moduleId || "");
      setActive(id ? data?.active : true);
      setWorkflowName(data?.name || "");
      setWorkflowPriority(data?.priority || 1);
      setRuleLogicalOperator(data?.ruleLogicalOperator || "AND");

      const normalizedConditions = (data?.ConfigConditions || []).map((c) => ({
        fieldId: String(c.fieldId ?? ""),
        operatorId: String(c.operatorId ?? ""),
        valueType: c.valueType || "STATIC",
        value: c.value ?? "",
        compareFieldId: c.compareFieldId ?? "",
      }));
      setConfigConditions(normalizedConditions);

      let levels = (data?.approvalLevels || []).map((lvl, i) => ({
        levelNo: lvl.levelNo || i + 1,
        approveType: lvl.approveType || "OR",
        condition: lvl.condition || "",
        users:
          lvl.LevelUsers?.map((u) => ({
            label: u.User?.username,
            value: u.userId,
          })) || [],
      }));

      if (levels.length < 2) {
        const extra = Array.from({ length: 2 - levels.length }, (_, i) => ({
          levelNo: levels.length + i + 1,
          approveType: "OR",
          condition: "",
          users: [],
        }));
        levels = [...levels, ...extra];
      }

      setApprovalLevelItems(levels);
      childRecord.current = data?.childRecord || 0;
    },
    [id],
  );

  // Replace existing useEffect for singleData with this:
  useEffect(() => {
    if (id && singleData?.data) {
      syncFormWithDb(singleData.data);
    } else if (!id) {
      // No id = new form, wipe everything
      syncFormWithDb(undefined);
    }
  }, [singleData, id]); // ← add id as dependency

  const { data: fieldData } = useGetApprovalFieldsQuery(moduleId, {
    skip: !moduleId,
  });
  const { data: operatorData } = useGetApprovalOperatorsQuery();

  const data = {
    id,
    branchId,
    moduleId: Number(moduleId),
    active,
    name: workflowName,
    priority: Number(workflowPriority),
    ruleLogicalOperator,
    ConfigConditions: configConditions?.filter(
      (c) => c.fieldId && c.operatorId,
    ),
    approvalLevelItems: approvalLevelItems?.filter(
      (item) => item.users.length > 0,
    ),
  };

  const validateData = (data) => {
    return data.moduleId && data.approvalLevelItems.length > 0 && data.name;
  };

  const handleSubmitCustom = async (callback, data, text) => {
    try {
      let returnData = await callback(data).unwrap();
      if (returnData.statusCode === 1) {
        toast.error(returnData.message);
        return;
      }
      toast.success(`${text} Successfully`);
      setForm(false);
      setId("");
      syncFormWithDb(undefined);
      dispatchInvalidate();
      invalidatePurchaseModule();
    } catch (error) {
      toast.error("Process failed");
    }
  };

  const saveData = (process) => {
    if (!validateData(data)) {
      toast.warning(
        "Please fill required fields (Name, Module, and at least one Level).",
      );
      return;
    }

    let foundItem = allData?.data
      ?.filter((i) => (id ? i.id != id : true))
      ?.some((item) => item.moduleId == moduleId && item.name === workflowName);

    if (foundItem) {
      toast.warning("This configuration already exists.");
      return;
    }

    if (id && !window.confirm("Are you sure update the details ...?")) return;

    if (id) {
      handleSubmitCustom(updateData, data, "Updated");
    } else {
      handleSubmitCustom(addData, data, "Added");
    }
  };

  const deleteData = async (deleteId) => {
    if (!window.confirm("Are you sure to delete...?")) return;
    try {
      let deldata = await removeData(deleteId || id).unwrap();
      if (deldata?.statusCode == 1) {
        toast.error(deldata?.message || "Something went wrong!");
        return;
      }
      toast.success("Deleted Successfully");
      setForm(false);
      setId("");
      dispatchInvalidate();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const onNew = () => {
    setId("");
    setReadOnly(false);
    setForm(true);
    setActiveTab(0);
    syncFormWithDb(undefined);
    setWorkflowName("");
    setConfigConditions([]);
    setApprovalLevelItems([]);
    setWorkflowPriority(1);
    setModuleId("");
    setActive(true);
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
      className: "w-12 text-center",
    },
    {
      header: "Module Name",
      accessor: (item) => item?.Module?.name,
      className: "text-left uppercase w-64",
    },
    {
      header: "Workflow Name",
      accessor: (item) => item?.name,
      className: "text-left uppercase w-64",
    },
    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  if (form) {
    return (
      <div className="p-0 bg-[#F1F1F0] h-full overflow-y-auto">
        <div className="w-full h-full shadow-lg px-2 py-1 bg-white flex flex-col">
          {/* Form Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h1 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              {MODEL}
              <ModeChip id={id} readOnly={readOnly} />
            </h1>
            <button
              onClick={() => {
                setForm(false);
                setId(""); // ← clear id so next open is fresh
                setReadOnly(false); // ← reset mode
                syncFormWithDb(undefined);
              }}
              className="text-indigo-600 hover:text-indigo-700 transition"
              title="Back to Report"
            >
              <IoArrowBackCircleSharp className="w-7 h-7" />
            </button>
          </div>

          <div className="flex-1 space-y-6">
            {/* Top Details Card (Single Row) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex gap-x-8">
                <TextInputNew1
                  name="Workflow Name"
                  type="text"
                  value={workflowName}
                  setValue={setWorkflowName}
                  required={true}
                  readOnly={readOnly}
                  disabled={childRecord.current > 0}
                />

                <DropdownInputNew
                  name="Form"
                  options={dropDownListObject(
                    moduleList?.data || [],
                    "name",
                    "id",
                  )}
                  value={moduleId}
                  setValue={setModuleId}
                  required={true}
                  readOnly={readOnly}
                />
                <div className="w-28">
                  <TextInputNew1
                    name="Priority Weight"
                    type="number"
                    value={workflowPriority}
                    setValue={setWorkflowPriority}
                    required={true}
                    readOnly={readOnly}
                    disabled={childRecord.current > 0}
                    className="text-right "
                  />
                </div>
                <div className="pb-1 ">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Status
                    <ToggleButton
                      name=""
                      value={active}
                      setActive={setActive}
                      readOnly={readOnly}
                      ref={refs.toggleButtonRef}
                    />{" "}
                  </label>
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="flex flex-col flex-1">
              <div className="flex border-b border-gray-200 bg-white rounded-t-lg overflow-hidden">
                <button
                  className={`flex-1 py-2 px-6 text-xs font-bold transition-all duration-200 ${activeTab === 0 ? "border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30" : "text-gray-500 hover:bg-gray-50"}`}
                  onClick={() => setActiveTab(0)}
                >
                  Rule Builder
                </button>
                <button
                  className={`flex-1 py-2 px-6 text-xs font-bold transition-all duration-200 ${activeTab === 1 ? "border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/30" : "text-gray-500 hover:bg-gray-50"}`}
                  onClick={() => setActiveTab(1)}
                >
                  Approval Levels
                </button>
              </div>

              <div
                className={`p-2 border border-t-0 border-gray-200 rounded-b-lg bg-white min-h-[400px] max-h-[400px] ${
                  activeTab === 1 ? "overflow-visible" : "overflow-y-auto"
                }`}
              >
                {activeTab === 0 ? (
                  <RuleBuilder
                    conditions={configConditions}
                    setConditions={setConfigConditions}
                    ruleLogicalOperator={ruleLogicalOperator}
                    setRuleLogicalOperator={setRuleLogicalOperator}
                    fieldOptions={fieldData?.data}
                    operatorOptions={operatorData?.data}
                    readOnly={readOnly}
                  />
                ) : (
                  <ApprovalDetails
                    approvalLevelItems={approvalLevelItems}
                    setApprovalLevelItems={setApprovalLevelItems}
                    userList={userList?.data}
                    roleList={roleList?.data}
                    readOnly={readOnly}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Form Actions */}
          <div className="flex flex-col md:flex-row gap-2 justify-between mt-6 pt-4 border-t">
            <div className="flex gap-2">
              <button
                onClick={() => saveData("close")}
                disabled={readOnly}
                title="Save & Close"
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 flex items-center text-sm shadow-sm transition"
              >
                <span className="flex items-center gap-y-1">
                  <FiSave className="w-4 h-4 mr-2" />
                  <HiX className="h-4 w-4" />
                </span>
              </button>
              <button
                onClick={() => saveData("new")}
                disabled={readOnly}
                title="Save & New"
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 flex items-center text-sm shadow-sm transition"
              >
                <span className="flex items-center gap-y-1">
                  <FiSave className="w-4 h-4 mr-2" />
                  <HiOutlineRefresh className="h-4 w-4" />
                </span>
              </button>
            </div>

            <div className="flex gap-2">
              {readOnly && (
                <button
                  onClick={() => setReadOnly(false)}
                  className="bg-yellow-600 text-white px-4 py-1.5 rounded-md hover:bg-yellow-700 flex items-center text-sm shadow-sm transition"
                >
                  <FiEdit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
              {/* {id && !readOnly && (
                <button
                  onClick={() => deleteData(id)}
                  className="bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 flex items-center text-sm shadow-sm transition"
                >
                  Delete
                </button>
              )} */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-[#F1F1F0] h-[85%]">
      <div className="flex flex-col sm:flex-row justify-between bg-white py-1 px-1 items-start sm:items-center mb-4 gap-x-4 rounded-tl-lg rounded-tr-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-lg font-bold text-gray-800">{MODEL} Report</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="hover:bg-green-700 bg-white border border-green-700 hover:text-white text-green-800 py-1 rounded-md flex items-center gap-2 text-xs px-2 shadow-sm transition-all duration-200"
            onClick={onNew}
          >
            <FaPlus /> Create New Workflow
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <ReusableTable
          columns={columns}
          data={allData?.data || []}
          onView={(id) => {
            setId(id);
            setForm(true);
            setReadOnly(true);
            syncFormWithDb(undefined);
          }}
          onEdit={(id) => {
            setId(id);
            setForm(true);
            setReadOnly(false);
            syncFormWithDb(undefined);
          }}
          onDelete={deleteData}
          itemsPerPage={10}
          isLoading={isLoading || isFetching}
        />
      </div>
    </div>
  );
}
