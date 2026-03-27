import { useState } from "react";
import PurchaseOrderForm from "./PurchaseOrderForm.js";
import PurchaseOrderFormReport from "./PurchaseOrderFormReport.js"
import { getCommonParams } from "../../../Utils/helper.js";
import { FaPlus } from "react-icons/fa";
import { useGetTaxTemplateQuery } from "../../../redux/services/TaxTemplateServices.js";
import { useGetPartyQuery } from "../../../redux/services/PartyMasterService.js";
import { useGetBranchByIdQuery, useGetBranchQuery } from "../../../redux/services/BranchMasterService.js";
import { useGetStyleItemMasterQuery } from "../../../redux/services/StyleItemMasterService.js";
import { useGetHsnMasterQuery } from "../../../redux/services/HsnMasterServices.js";
import { useGetUnitOfMeasurementMasterQuery } from "../../../redux/uniformService/UnitOfMeasurementServices";
import Swal from "sweetalert2";
import { useDeletePoMutation, useLazyGetPoByIdQuery } from "../../../redux/uniformService/PoServices.js";
import { useGetTermsandCondtionsQuery } from "../../../redux/uniformService/TermsAndContionService.js";
import { useGetPaytermMasterQuery } from "../../../redux/services/payTermMasterService.js";
import { useGetItemGroupMasterQuery } from "../../../redux/services/ItemGroupMasterService.js";
import { useGetSizeMasterQuery } from "../../../redux/services/SizemasterService.js";
import { useGetColorMasterQuery } from "../../../redux/services/ColorMasterService.js";
import purchaseInwardEntryApi from "../../../redux/uniformService/PurchaseInwardEntry";
import purchaseReturnApi from "../../../redux/services/PurchaseReturnService";
import purchaseCancelApi from "../../../redux/uniformService/PurchaseCancelService";
import StyleItemMasterApi from "../../../redux/services/StyleItemMasterService.js";
import { useDispatch } from "react-redux";
import { invalidatePurchaseModule } from "../../../redux/Dispatch/PurchaseInvalidateTags.js";

export default function Form() {
  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const dispatch = useDispatch();
  const { branchId, companyId, finYearId, userId } = getCommonParams()
  const params = {
    branchId, companyId, finYearId
  };
  const {
    data: termsData,
    isLoading,
    isFetching,
  } = useGetTermsandCondtionsQuery({ params });
  const {
    data: branchData,
  } = useGetBranchByIdQuery(branchId, { skip: !branchId });
  const [trigger, { data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading, }] =
    useLazyGetPoByIdQuery();
  const handleView = (orderId) => {
    setId(orderId);
    setShowForm(true);
    setReadOnly(true);
  };

  const handleEdit = (orderId) => {
    setId(orderId);
    setShowForm(true);
    setReadOnly(false);
  };
  const [removeData] = useDeletePoMutation();
  const handleDelete = async (id) => {
    setId(id);
    const { data } = await trigger(id);
    if (id) {
      if (!window.confirm("Are you sure to delete...?")) {
        return;
      }
      if (data?.data?.childRecordInward > 0) {
        Swal.fire({
          icon: "error",
          title: "This Transaction Items used in Purchase Inward",
          text: "Data cannot be deleted!",
        });
      }
      else if (data?.data?.childRecordCancel > 0) {
        Swal.fire({
          icon: "error",
          title: "This Transaction Items used in Purchase Cancel",
          text: "Data cannot be deleted!",
        });
      }
      else {
        try {
          let deldata = await removeData(id).unwrap();
          if (deldata?.statusCode == 1) {
            Swal.fire({
              icon: "error",
              title: "Child record Exists",
              text: deldata.data?.message || "Data cannot be deleted!",
            });
            return;
          }
          setId("");
          Swal.fire({
            title: "Deleted Successfully",
            icon: "success",
            timer: 1000,
          });
          setShowForm(false);
          dispatch(StyleItemMasterApi.util.invalidateTags(["StyleItemMaster"]));
          invalidatePurchaseModule();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Submission error",
            text: error.data?.message || "Something went wrong!",
          });
          setShowForm(false);
        }
      }
    }
  };

  const onNew = () => {
    setId("");
    setReadOnly(false);
  };

  const { data: taxTypeList, isLoading: isTaxLoading, isFetching: isTaxfetching } =
    useGetTaxTemplateQuery({ params: { ...params } });
  const { data: supplierList } = useGetPartyQuery({ params: { ...params } });
  const { data: branchList } = useGetBranchQuery({ params: { ...params } });
  const { data: styleItemList } = useGetStyleItemMasterQuery({ params: { ...params } });
  const { data: uomList } = useGetUnitOfMeasurementMasterQuery({ params });
  const { data: hsnList } =
    useGetHsnMasterQuery({ params });
  const { data: payTermList } = useGetPaytermMasterQuery({ params });
  const { data: itemGroupList } = useGetItemGroupMasterQuery({ params });
  const { data: sizeList } = useGetSizeMasterQuery({ params });
  const { data: colorList } = useGetColorMasterQuery({ params });

  return (
    <>
      <div
        className="p-1 bg-[#F1F1F0] h-[85%]"
        style={{ display: showForm ? "none" : "block" }}
      >
        <div className="flex flex-col sm:flex-row justify-between bg-white py-1 px-1 items-start sm:items-center mb-4 gap-x-4 rounded-tl-lg rounded-tr-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Purchase Order Report
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="hover:bg-green-700 bg-white border border-green-700 hover:text-white text-green-800 px-4 py-1 rounded-md flex items-center gap-2 text-sm"
              onClick={() => {
                setShowForm(true);
                onNew();
              }}
            >
              <FaPlus /> Create New
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <PurchaseOrderFormReport
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            itemsPerPage={10}
          // searchStyleId={searchStyleId}
          />
        </div>
      </div>

      {showForm && (
        <PurchaseOrderForm
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          id={id}
          setId={setId}
          onClose={() => {
            setShowForm(false);
            setReadOnly((prev) => !prev);
          }}
          setShowForm={setShowForm}
          taxTypeList={taxTypeList}
          supplierList={supplierList}
          branchList={branchList}
          uomList={uomList}
          styleItemList={styleItemList}
          hsnList={hsnList}
          termsData={termsData}
          payTermList={payTermList}
          itemGroupList={itemGroupList}
          sizeList={sizeList}
          colorList={colorList}
          branchData={branchData}
        />
      )}
    </>
  );

}