import { useDispatch } from "react-redux";
import { getCommonParams } from "../../../Utils/helper";
import { useGetTermsandCondtionsQuery } from "../../../redux/uniformService/TermsAndContionService";
import { useGetUserByIdQuery } from "../../../redux/services/UsersMasterService";
import { useGetPartyQuery } from "../../../redux/services/PartyMasterService.js";
import { useGetBranchQuery } from "../../../redux/services/BranchMasterService.js";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import JobCardForm from "./JobCardForm.jsx";
import JobCardReport from "./JobCardReport.jsx";
import { useDeleteJobCardMutation } from "../../../redux/uniformService/JobCardService.js";
import { useGetGsmMasterQuery } from "../../../redux/services/GsmMasterService.js";

const index = () => {
    const [showForm, setShowForm] = useState(false);
    const [id, setId] = useState("");
    const [readOnly, setReadOnly] = useState(false);

    const dispatch = useDispatch();
    const { branchId, companyId, finYearId, userId } = getCommonParams();
    const params = {
        branchId,
        companyId,
        finYearId,
    };
    const {
        data: gsmList,
        isLoading,
        isFetching,
    } = useGetGsmMasterQuery({ params });

    const { data: userData } = useGetUserByIdQuery(userId)

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
    const [removeData] = useDeleteJobCardMutation();
    const handleDelete = async (id) => {
        setId(id);
        if (id) {
            if (!window.confirm("Are you sure to delete...?")) {
                return;
            }

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
                dispatchInvalidate();
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
    };



    const onNew = () => {
        setId("");
        setReadOnly(false);
    };


    const { data: customerList } = useGetPartyQuery({ params: { ...params } });
    const { data: branchList } = useGetBranchQuery({ params: { ...params } });

    return (
        <>
            <div
                className="p-1 bg-[#F1F1F0] h-[85%]"
                style={{ display: showForm ? "none" : "block" }}
            >
                <div className="flex flex-col sm:flex-row justify-between bg-white py-1 px-1 items-start sm:items-center mb-4 gap-x-4 rounded-tl-lg rounded-tr-lg shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">
                            Job Card Report
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="hover:bg-green-700 bg-white border border-green-700 hover:text-white text-green-800  py-1 rounded-md flex items-center gap-2 text-xs px-2"
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
                    <JobCardReport
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        itemsPerPage={10}
                        userData={userData?.data}
                    />
                </div>
            </div>

            {showForm && (
                <div className="h-[93vh] overflow-hidden">
                    <JobCardForm
                        readOnly={readOnly}
                        setReadOnly={setReadOnly}
                        id={id}
                        setId={setId}
                        onClose={() => {
                            setShowForm(false);
                            setReadOnly((prev) => !prev);
                        }}
                        setShowForm={setShowForm}
                        customerList={customerList}
                        branchList={branchList}
                        userData={userData?.data}
                        gsmList={gsmList}
                    />
                </div>
            )}
        </>
    );
}

export default index