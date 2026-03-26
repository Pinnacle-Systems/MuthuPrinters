import React, { useEffect, useState, useRef, useCallback } from "react";
import secureLocalStorage from "react-secure-storage";
import {
    useGetEmployeeQuery,
    useGetEmployeeByIdQuery,
    useAddEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
} from "../../../redux/services/EmployeeMasterService";
import { useGetCountriesQuery } from "../../../redux/services/CountryMasterService";
import { useGetCityQuery } from "../../../redux/services/CityMasterService";
import LiveWebCam from "../LiveWebCam";
import FormHeader from "../FormHeader";
import FormReport from "../FormReportTemplate";
import { toast } from "react-toastify";
import { TextInput, DropdownInput, TextArea, CurrencyInput, DateInput, DisabledInput, ReusableTable, ToggleButton, TextInputNew, DropdownInputNew, DateInputNew, TextAreaNew, TextInputNew1 } from "../../../Inputs";
import ReportTemplate from "../ReportTemplate";
import { dropDownListObject, dropDownListMergedObject } from '../../../Utils/contructObject';
import Modal from "../../../UiComponents/Modal";
import { statusDropdown, employeeType, genderList, maritalStatusList, bloodList } from "../../../Utils/DropdownData";
import moment from "moment";
import { useGetEmployeeCategoryQuery } from "../../../redux/services/EmployeeCategoryMasterService";
import { getCommonParams, viewBase64String } from '../../../Utils/helper';
import SingleImageFileUploadComponent from "../SingleImageUploadComponent";
import EmployeeLeavingForm from "./EmployeeLeavingForm";
import { useGetDepartmentQuery } from "../../../redux/services/DepartmentMasterService";
import EmployeeReport from "./Report";
import { useDispatch } from "react-redux";
import Loader from "../Loader";
import { Check, LayoutGrid, Plus, Power, Table } from "lucide-react";
import imageDefault from "../../../assets/default-dp.png"
import Swal from "sweetalert2";

const MODEL = "Employee Master";


export default function Form() {
    const [form, setForm] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);

    const [readOnly, setReadOnly] = useState(false);

    const [id, setId] = useState("");
    const [panNo, setPanNo] = useState("");
    const [name, setName] = useState("");
    const [fatherName, setFatherName] = useState("");
    const [dob, setDob] = useState("");
    const [chamberNo, setChamberNo] = useState("");
    const [localAddress, setlocalAddress] = useState("");
    const [localCity, setLocalCity] = useState("");
    const [localPincode, setLocalPincode] = useState("");
    const [mobile, setMobile] = useState("");
    const [degree, setDegree] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [salaryPerMonth, setSalaryPerMonth] = useState("");
    const [commissionCharges, setCommissionCharges] = useState("");
    const [gender, setGender] = useState("");
    const [regNo, setRegNo] = useState("");
    const [joiningDate, setJoiningDate] = useState("");
    const [permAddress, setPermAddress] = useState("");
    const [permCity, setPermCity] = useState("");
    const [permPincode, setPermPincode] = useState("")
    const [email, setEmail] = useState("");
    const [maritalStatus, setMaritalStatus] = useState("");
    const [consultFee, setConsultFee] = useState("");
    const [accountNo, setAccountNo] = useState("");
    const [ifscNo, setIfscNo] = useState("");
    const [branchName, setbranchName] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [department, setDepartment] = useState("");
    const [employeeCategory, setEmployeeCategory] = useState();
    const [permanent, setPermanent] = useState("");
    const [active, setActive] = useState(true);
    const [bankName, setBankName] = useState('')
    const [branchPrefixCategory, setBranchPrefixCategory] = useState("");
    // Employee Leaving form fields
    const [leavingForm, setLeavingForm] = useState(false);

    const [leavingDate, setLeavingDate] = useState("");
    const [leavingReason, setLeavingReason] = useState("");
    const [canRejoin, setCanRejoin] = useState("");
    const [rejoinReason, setRejoinReason] = useState("");

    const [searchValue, setSearchValue] = useState("");
    const [image, setImage] = useState(null);

    const childRecord = useRef(0);
    const dispatch = useDispatch();
    const [view, setView] = useState("table");

    const { branchId, userId, companyId, finYearId } = getCommonParams()

    const params = {
        companyId: secureLocalStorage.getItem(
            sessionStorage.getItem("sessionId") + "userCompanyId"
        ),
    };
    const { data: countriesList, isLoading: isCountryLoading, isFetching: isCountryFetching } =
        useGetCountriesQuery({ params });

    const { data: cityList, isLoading: cityLoading, isFetching: cityFetching } =
        useGetCityQuery({ params });

    const { data: employeeCategoryList } =
        useGetEmployeeCategoryQuery({ params });

    const { data: departmentList } =
        useGetDepartmentQuery({ params });
    const { data: allData, isLoading, isFetching } = useGetEmployeeQuery({ params, searchParams: searchValue });



    const isCurrentEmployeeDoctor = (employeeCategory) => employeeCategoryList.data.find((cat) => parseInt(cat.id) === parseInt(employeeCategory))?.name?.toUpperCase() === "DOCTOR";
    const {
        data: singleData,
        isFetching: isSingleFetching,
        isLoading: isSingleLoading,
    } = useGetEmployeeByIdQuery(id, { skip: !id });

    const [addData] = useAddEmployeeMutation();
    const [updateData] = useUpdateEmployeeMutation();
    const [removeData] = useDeleteEmployeeMutation();

    const syncFormWithDb = useCallback((data) => {
        // if (id) setReadOnly(true);
        childRecord.current = data?.childRecord ? data?.childRecord : 0;

        setPanNo(data?.panNo ? data?.panNo : "");
        setName(data?.name ? data?.name : "");
        setFatherName(data?.fatherName ? data?.fatherName : "");
        setDob(data?.dob ? moment.utc(data?.dob).format('YYYY-MM-DD') : "");
        setChamberNo(data?.chamberNo ? data?.chamberNo : "");
        setlocalAddress(data?.localAddress ? data?.localAddress : "");
        setLocalCity(data?.localCity?.id ? data?.localCity?.id : "");
        setLocalPincode(data?.localPincode ? data?.localPincode : "");
        setMobile(data?.mobile ? data?.mobile : "");
        setDegree(data?.degree ? data?.degree : "");
        setSpecialization(data?.specialization ? data?.specialization : "");
        setSalaryPerMonth(data?.salaryPerMonth ? data?.salaryPerMonth : "");
        setCommissionCharges(data?.commissionCharges ? data?.commissionCharges : "");
        setGender(data?.gender ? data?.gender : "");
        setRegNo(data?.regNo ? data?.regNo : "");
        setJoiningDate(data?.joiningDate ? moment.utc(data?.joiningDate).format('YYYY-MM-DD') : "");
        setPermAddress(data?.permAddress ? data?.permAddress : "");
        setPermCity(data?.permCity ? data?.permCity?.id : "");
        setPermPincode(data?.permPincode ? data?.permPincode : "");
        setEmail(data?.email ? data?.email : "");
        setMaritalStatus(data?.maritalStatus ? data?.maritalStatus : "");
        setConsultFee(data?.consultFee ? data?.consultFee : "");
        setAccountNo(data?.accountNo ? data?.accountNo : "");
        setIfscNo(data?.ifscNo ? data?.ifscNo : "");
        setbranchName(data?.branchName ? data?.branchName : "");
        setBloodGroup(data?.bloodGroup ? data?.bloodGroup : "");
        setDepartment(data?.departmentId ? data?.department?.id : "");
        setImage(data?.imageBase64 ? viewBase64String(data?.imageBase64) : null);
        setEmployeeCategory(data?.employeeCategoryId ? data?.employeeCategoryId : "");
        setPermanent(data?.permanent ? data?.permanent : "");
        setActive(data ? data.active : true);
        setBankName(data?.bankName ? data?.bankName : "")
        // Employee Leaving Form states
        setLeavingDate(data?.leavingDate ? data?.leavingDate : "");
        setLeavingReason(data?.leavingReason ? data?.leavingReason : "");
        setCanRejoin(data?.canRejoin ? data?.canRejoin : false);
        setRejoinReason(data?.rejoinReason ? data?.rejoinReason : "");
        secureLocalStorage.setItem(sessionStorage.getItem("sessionId") + "currentEmployeeSelected", data?.id);
    }, [id]);

    useEffect(() => {
        syncFormWithDb(singleData?.data);
    }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

    const data = {
        branchId, userId, companyId, finYearId,
        panNo, name, fatherName, dob, chamberNo, localAddress, localCity, localPincode, mobile, degree, specialization, salaryPerMonth,
        commissionCharges, gender, joiningDate, permAddress, permCity, permPincode, email, maritalStatus, consultFee, accountNo,
        ifscNo, branchName, bloodGroup, ...department && { department }, employeeCategoryId: employeeCategory, permanent, active,
        id, leavingReason, leavingDate, canRejoin, rejoinReason, bankName
    }

    // if (data.name && data.gender && data.bloodGroup && data.dob && data.active && data.employeeCategory && data.department && data.chamberNo && data.joiningDate && data.fatherName && data.maritalStatus && data.panNo && data.specialization && data.accountNo
    //         && data.ifscNo && data.branchName && data.mobile && data.email && data.localAddress && data?.permPincode && data.permCity

    //     ) 
    // const validateData = (data) => {


    // return data.name && data.gender && data.bloodGroup && data.dob && data.active && data.employeeCategoryId && data.department && 

    // data.joiningDate && data.mobile  && data.localAddress && data?.permPincode && data.permCity 
    // }

    const validateData = (data) => {

        if (data.name && data.gender && data.bloodGroup && data.dob && data.active && data.employeeCategoryId && data.department && data.joiningDate && data.mobile && data.localAddress && data?.permPincode && data.permCity && data?.maritalStatus

        ) {
            return true;
        }
        return false;
    }
    const handleSubmitCustom = async (callback, data, text) => {
        try {
            let returnData;
            const formData = new FormData()
            for (let key in data) {
                formData.append(key, data[key]);
            }
            if (image instanceof File) {
                formData.append("image", image);
            } else if (!image) {
                formData.append("isDeleteImage", true);
            }
            if (text === "Updated") {
                returnData = await callback({ id, body: formData }).unwrap();
            } else {
                returnData = await callback(formData).unwrap();
            }
            setId("")
            syncFormWithDb(undefined)
            setForm(false)
            Swal.fire({
                title: text + "Successfully",
                icon: "success",

            }); dispatch({
                type: `EmployeeCategoryMaster/invalidateTags`,
                payload: ['Employee Category'],
            });
            dispatch({
                type: `DepartmentMaster/invalidateTags`,
                payload: ['Department'],
            });
            dispatch({
                type: `CityMaster/invalidateTags`,
                payload: ['City/State Name'],
            });

        } catch (error) {
            console.log("handle");
        }
    };

    const saveData = () => {
        if (!validateData(data)) {
            Swal.fire({
                title: "Please fill all required fields...!",
                icon: "success",

            }); return
        }
        // if (!validateEmail(data.email)) {
        //     toast.info("Please enter proper email id!", { position: "top-center" })
        //     return
        // }
        // if (!validateMobile(data.mobile)) {
        //     toast.info("Please enter proper mobile number...!", { position: "top-center" })
        //     return
        // }
        // if (!validatePan(data.panNo)) {
        //     toast.info("Please enter proper pan number...!", { position: "top-center" })
        //     return
        // }
        // if (!validatePincode(data.localPincode)) {
        //     toast.info("Please enter proper local Pincode...!", { position: "top-center" })
        //     return
        // }
        // if (data.permPincode && !validatePincode(data.permPincode)) {
        //     toast.info("Please enter proper perm. Pincode...!", { position: "top-center" })
        //     return
        // }
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
                text: "The Employee Name already exists.",
                icon: "warning",
              });
              return false;
            }
        if (!window.confirm("Are you sure save the details ...?")) {
            return;
        }
        if (!JSON.parse(active)) {
            setLeavingForm(true);
        } else {
            if (id) {
                handleSubmitCustom(updateData, data, "Updated");
            } else {
                handleSubmitCustom(addData, data, "Added");
            }
        }
    }


    const deleteData = async (id, childRecord) => {
        if (childRecord) {
            Swal.fire({
                title: 'Child Record Exists',
                icon: 'error',
            });
            return
        }
        if (id) {
            if (!window.confirm("Are you sure to delete...?")) {
                return;
            }
            try {
                await removeData(id)
                setId("");
                dispatch({
                    type: `EmployeeCategoryMaster/invalidateTags`,
                    payload: ['Employee Category'],
                });
                dispatch({
                    type: `DepartmentMaster/invalidateTags`,
                    payload: ['Department'],
                });
                dispatch({
                    type: `cityMaster/invalidateTags`,
                    payload: ['City/State Name'],
                });
                Swal.fire({
                    title: "Deleted Successfully",
                    icon: "success",

                });
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
        syncFormWithDb(undefined)
    };

    function onDataClick(id) {
        setId(id);
        setForm(true);
    }
    const tableHeaders = ["Employee Id", "Name", "Employee Category"]
    const tableDataNames = ["dataObj.regNo", "dataObj.name", 'dataObj?.EmployeeCategory?.name']
    const submitLeavingForm = () => {
        console.log("sdfsdfsdfsdf")
        if (id) {
            console.log("called id")
            handleSubmitCustom(updateData, data, "Updated");
        } else {
            console.log("called no id")
            handleSubmitCustom(addData, data, "Added");
        }
        setLeavingForm(false);
    }

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
            header: "Employee Id",
            accessor: (item) => item?.regNo,
            //   cellClass: () => "font-medium  text-gray-900",
            className: "font-medium text-gray-900 text-center uppercase w-40",
        },

        {
            header: "Employee Name",
            accessor: (item) => item?.name,
            //   cellClass: () => "font-medium text-gray-900",
            className: "font-medium text-gray-900 text-left uppercase w-72",
        },
        {
            header: "Employee Category",
            accessor: (item) => item?.EmployeeCategory?.name,
            //   cellClass: () => "font-medium text-gray-900",
            className: "font-medium text-gray-900 text-left uppercase w-48",
        },
        {
            header: "Gender",
            accessor: (item) => item?.gender,
            //   cellClass: () => "font-medium text-gray-900",
            className: "font-medium text-gray-900 text-left uppercase w-24",
        },
        {
            header: "Status",
            accessor: (item) => (item.active ? ACTIVE : INACTIVE),
            //   cellClass: () => "font-medium text-gray-900",
            className: "font-medium text-gray-900 text-center uppercase w-16",
        },

    ];

    // if (!form)
    //     return (
    //         <EmployeeReport
    //             loading={
    //                 isLoading || isFetching
    //             }
    //             setForm={setForm}
    //             employees={allData?.data}
    //             onClick={onDataClick}
    //             onNew={onNew}
    //             searchValue={searchValue}
    //             setSearchValue={setSearchValue}
    //         />
    //     );
    // if (!countriesList?.data || !employeeCategoryList?.data || !cityList?.data) return <Loader />
    const input1Ref = useRef(null);
    const input2Ref = useRef(null);
    const input3Ref = useRef(null);
    const handleKeyNext = (e, nextRef) => {
        if (e.key === "Enter") {
            e.preventDefault();
            nextRef?.current?.focus();
        }
    };
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const validateStep = () => {
        let newErrors = {};
        if (step === 1) {
            if (!data.employeeCategoryId)
                newErrors.employeeCategory = "Employee Category is required";
            if (!data.name) newErrors.name = "Name is required";
            if (!data.joiningDate) newErrors.joiningDate = "Joining Date is required";
            if (!data.department) newErrors.department = "Select a department";
        } else if (step === 2) {
            if (!data.mobile) newErrors.mobile = "Mobile No is required";
        } else if (step === 3) {
            if (!data.dob) newErrors.dob = "Date of Birth is required";
            if (!data.gender) newErrors.gender = "Gender is required";
        } else if (step === 4) {
            if (!data.localAddress)
                newErrors.localAddress = "Local Address is required";
            if (!data.localPincode)
                newErrors.localPincode = "Local Pincode is required";
            if (!data.localCity) newErrors.localCity = "Local City is required";
        } else if (step === 6) {
            if (!data.active) newErrors.active = "Set Status";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const countryNameRef = useRef(null);

    useEffect(() => {
        if (form && countryNameRef.current) {
            countryNameRef.current.focus();
        }
    }, [form]);

    return (
        // <div
        //     onKeyDown={handleKeyDown}
        //     className="md:items-start md:justify-items-center grid h-full bg-theme"
        // >
        //     <Modal isOpen={cameraOpen} onClose={() => setCameraOpen(false)}>
        //         <LiveWebCam picture={image} setPicture={setImage} onClose={() => setCameraOpen(false)} />
        //     </Modal>
        //     <Modal isOpen={leavingForm} onClose={() => setLeavingForm(false)}>
        //         <EmployeeLeavingForm leavingReason={leavingReason} setLeavingReason={setLeavingReason}
        //             leavingDate={leavingDate} setLeavingDate={setLeavingDate}
        //             canRejoin={canRejoin} setCanRejoin={setCanRejoin}
        //             rejoinReason={rejoinReason} setRejoinReason={setRejoinReason}
        //             onSubmit={submitLeavingForm} onClose={() => { setLeavingForm(false) }} />
        //     </Modal>
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
        //         <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-x-2">
        //             <div className="col-span-3 grid md:grid-cols-2 border h-[520px] overflow-auto">
        //                 <div className='col-span-3 grid md:grid-cols-2 border'>
        //                     <div className='mr-1 md:ml-2'>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Employee Category Info</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <DropdownInput name="Employee Category" options={dropDownListObject(id ? employeeCategoryList.data : employeeCategoryList.data.filter(item => item.active), "name", "id")} value={employeeCategory} setValue={(value) => { setEmployeeCategory(value); if (!isCurrentEmployeeDoctor(value)) { setDepartment("") }; setChamberNo(""); }} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 {(branchPrefixCategory === "Specific")
        //                                     ?
        //                                     <DropdownInput name="Employee Type" options={employeeType} value={permanent} setValue={setPermanent} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                     :
        //                                     ""
        //                                 }
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1 flex'>
        //                             <legend className='sub-heading'>Official Details</legend>
        //                             <SingleImageFileUploadComponent setWebCam={setCameraOpen} disabled={readOnly} image={image} setImage={setImage} />
        //                             <div className='flex flex-col justify-start gap-2 mt- flex-1'>
        //                                 {id ? <DisabledInput name="Employee Id" type={"text"} value={regNo} /> : ""}
        //                                 <TextInput name="Name" type="text" value={name} setValue={setName} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="Chamber no" type="text" value={chamberNo} setValue={setChamberNo} readOnly={readOnly} required={isCurrentEmployeeDoctor(employeeCategory)} disabled={(childRecord.current > 0)} />
        //                                 <DropdownInput name="Department" options={dropDownListObject(id ? departmentList.data : departmentList.data.filter(item => item.active), "name", "id")} value={department} setValue={setDepartment} required={isCurrentEmployeeDoctor(employeeCategory)} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DateInput name="Joining Date" value={joiningDate} setValue={setJoiningDate} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Personal Details</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <TextInput name="Father Name" type="text" value={fatherName} setValue={setFatherName} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DateInput name="Date Of Birth" value={dob} setValue={setDob} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DropdownInput name="Gender" options={genderList} value={gender} setValue={setGender} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DropdownInput name="Marital Status" options={maritalStatusList} value={maritalStatus} setValue={setMaritalStatus} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DropdownInput name="Blood Group" options={bloodList} value={bloodGroup} setValue={setBloodGroup} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="Pan No" type="pan_no" value={panNo} setValue={setPanNo} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame  my-1'>
        //                             <legend className='sub-heading'>Payment</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <CurrencyInput name="Consult Fee" value={consultFee} setValue={setConsultFee} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <CurrencyInput name="Salary/Month" value={salaryPerMonth} setValue={setSalaryPerMonth} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <CurrencyInput name="Commission charges" value={commissionCharges} setValue={setCommissionCharges} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Perm. Address</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <TextArea name="Perm. Address" value={permAddress} setValue={setPermAddress} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="Pincode" type="number" value={permPincode} setValue={setPermPincode} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DropdownInput name="City/State Name" options={dropDownListMergedObject(id ? cityList.data : cityList.data.filter(item => item.active), "name", "id")} value={permCity} setValue={setPermCity} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                     </div>
        //                     <div className='mr-1'>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Contact Details</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <TextInput name="Email Id" type="text" value={email} setValue={setEmail} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="Mobile No" type="number" value={mobile} setValue={setMobile} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Bank Details</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <TextInput name="Account No" type="number" value={accountNo} setValue={setAccountNo} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="IFSC No" type="text" value={ifscNo} setValue={setIfscNo} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="Branch Name" type="text" value={branchName} setValue={setbranchName} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Education</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <TextInput name="Degree" type="text" value={degree} setValue={setDegree} readOnly={readOnly} required={true} />
        //                                 <TextInput name="Specialization" type="text" value={specialization} setValue={setSpecialization} readOnly={readOnly} required={true} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Local Address</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <TextArea name="Local Address" value={localAddress} setValue={setlocalAddress} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <TextInput name="Pincode" type="number" value={localPincode} setValue={setLocalPincode} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                                 <DropdownInput name="City/State Name" options={dropDownListMergedObject(id ? cityList.data : cityList.data.filter(item => item.active), "name", "id")} value={localCity} setValue={setLocalCity} required={true} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                         <fieldset className='frame my-1'>
        //                             <legend className='sub-heading'>Employee Status</legend>
        //                             <div className='grid grid-cols-1 my-2'>
        //                                 <DropdownInput name="Status" options={statusDropdown} value={active} setValue={setActive} readOnly={readOnly} disabled={(childRecord.current > 0)} />
        //                             </div>
        //                         </fieldset>
        //                     </div>
        //                 </div>
        //             </div>
        //             <div className="frame hidden md:block overflow-x-hidden">
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
        <div onKeyDown={handleKeyDown} className="p-1 ">
            <div className="w-full flex bg-white p-1 justify-between  items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                    Employee Master
                </h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setForm(true);
                            onNew();
                            //   setNewForm(true);
                        }}
                        className="bg-white border text-xs border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add New Employee
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView("table")}
                            className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${view === "table"
                                ? "bg-indigo-100 text-indigo-600"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Table size={16} />
                            Table
                        </button>
                        <button
                            onClick={() => setView("card")}
                            className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${view === "card"
                                ? "bg-indigo-100 text-indigo-600"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <LayoutGrid size={16} />
                            Cards
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-gray-100  rounded-xl shadow overflow-hidden">
                <div className="pt-2">
                    {view === "table" ? (
                        // <Mastertable
                        //   header={`Employees list`}
                        //   searchValue={searchValue}
                        //   setSearchValue={setSearchValue}
                        //   onDataClick={onDataClick}
                        //   tableHeaders={tableHeaders}
                        //   tableDataNames={tableDataNames}
                        //   data={allData?.data}
                        //   setReadOnly={setReadOnly}
                        //   deleteData={deleteData}
                        // />
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
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {allData?.data?.map((employee, index) => (
                                <div
                                    key={index}
                                    onClick={() => onDataClick(employee.id)}
                                    className={`border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer ${employee?.active ? "border-green-200" : "border-red-200"
                                        }`}
                                >
                                    <div
                                        className={`p-4 ${employee?.active ? "bg-green-50" : "bg-red-50"
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <img
                                                src={employee?.imageBase64 || imageDefault}
                                                alt="Profile"
                                                className={`w-12 h-12 object-cover rounded-full border-2 ${employee?.active
                                                    ? "border-green-500"
                                                    : "border-red-500"
                                                    }`}
                                            />
                                            <div className="ml-3">
                                                <h3 className="font-medium text-gray-900">
                                                    {employee?.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {employee?.regNo}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500">Department</p>
                                                <p className="font-medium">
                                                    {employee?.department?.name || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Status</p>
                                                <p
                                                    className={`font-medium ${employee?.active ? "text-green-600" : "text-red-600"
                                                        }`}
                                                >
                                                    {employee?.active ? "Active" : "Inactive"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Mobile</p>
                                                <p className="font-medium">{employee?.mobile || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Email</p>
                                                <p className="font-medium truncate">
                                                    {employee?.email || "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {form && (
                <Modal
                    isOpen={form}
                    form={form}
                    widthClass={"w-[95%] h-[85vh]"}
                    onClose={() => {
                        setForm(false);
                        // setErrors({});
                    }}
                >
                    <div className="h-full flex flex-col bg-gray-200">
                        <div className="border-b py-2 px-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white mt-2">
                            <div className="flex items-center gap-2 ">
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {id ? (!readOnly ? "Edit Employee" : "Employee Master") : "Add New Employee"}
                                </h2>
                                {regNo && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                        {regNo}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div>
                                    {!readOnly && (
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
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                                <div className="lg:col-span-3 space-y-3">
                                    <div className="bg-white p-3 rounded-md border border-gray-200">
                                        <SingleImageFileUploadComponent
                                            setWebCam={setCameraOpen}
                                            disabled={readOnly}
                                            image={image}
                                            setImage={setImage}
                                            className="mb-3"
                                        />

                                        <div className="space-y-2">
                                            <TextInputNew1
                                                ref={countryNameRef}
                                                name="Full Name"
                                                value={name}
                                                setValue={setName}
                                                required={true}
                                                readOnly={readOnly}
                                                disabled={childRecord.current > 0}
                                                onKeyDown={(e) => handleKeyNext(e, input2Ref)}
                                            />
                                            {errors.name && <span className="text-red-500 text-xs ml-1">{errors.name}</span>}

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <DropdownInputNew
                                                        ref={input2Ref}
                                                        name="Gender"
                                                        options={genderList}
                                                        value={gender}
                                                        setValue={setGender}
                                                        required
                                                        readOnly={readOnly}
                                                        disabled={childRecord.current > 0}
                                                    />
                                                    {errors.gender && <span className="text-red-500 text-xs ml-1">{errors.gender}</span>}
                                                </div>

                                                <div>
                                                    <DropdownInputNew
                                                        name="Blood Group"
                                                        options={bloodList}
                                                        value={bloodGroup}
                                                        setValue={setBloodGroup}
                                                        required={true}
                                                        readOnly={readOnly}
                                                        disabled={childRecord.current > 0}
                                                    />
                                                    {errors.bloodGroup && <span className="text-red-500 text-xs ml-1">{errors.bloodGroup}</span>}
                                                </div>
                                            </div>

                                            <DateInputNew
                                                name="Date of Birth"
                                                value={dob}
                                                setValue={setDob}
                                                required
                                                readOnly={readOnly}
                                                disabled={childRecord.current > 0}
                                                type={"date"}
                                            />
                                            {errors.dob && <span className="text-red-500 text-xs ml-1">{errors.dob}</span>}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3  rounded-md border border-gray-200 mt-2 h-[90px]" >
                                        {/* <h3 className="font-medium text-gray-800 mb-2 text-sm">Employment Status</h3> */}
                                        <div className="space-y-3 mt-2 ">
                                            <ToggleButton
                                                name="Employment Status"
                                                options={statusDropdown}
                                                value={active}
                                                setActive={setActive}
                                                required={true}
                                                readOnly={readOnly}
                                            />
                                            {errors.active && <span className="text-red-500 text-xs ml-1">{errors.active}</span>}

                                            {!active && (
                                                <button
                                                    type="button"
                                                    onClick={() => setLeavingForm(true)}
                                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                                >
                                                    Add Leaving Details
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 space-y-3 ">
                                    <div className="bg-white p-3 rounded-md border border-gray-200 h-[230px]">
                                        <h3 className="font-medium text-gray-800 mb-2 text-sm">Official Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <DropdownInputNew
                                                    ref={input3Ref}
                                                    name="Employee Category"
                                                    options={dropDownListObject(
                                                        id
                                                            ? employeeCategoryList?.data
                                                            : employeeCategoryList?.data?.filter(
                                                                (item) => item.active
                                                            ),
                                                        "name",
                                                        "id" || []
                                                    )}
                                                    value={employeeCategory}
                                                    setValue={(value) => setEmployeeCategory(value)}
                                                    required={true}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                    onKeyDown={(e) => handleKeyNext(e, null)}
                                                />
                                                {errors.employeeCategory && <span className="text-red-500 text-xs ml-1">{errors.employeeCategory}</span>}
                                            </div>

                                            <div>
                                                <DropdownInputNew
                                                    name="Department"
                                                    options={dropDownListObject(
                                                        id
                                                            ? departmentList?.data
                                                            : departmentList?.data?.filter(
                                                                (item) => item.active
                                                            ),
                                                        "name",
                                                        "id"
                                                    )}
                                                    value={department}
                                                    setValue={setDepartment}
                                                    readOnly={readOnly}
                                                    required={true}
                                                    // disabled={childRecord.current > 0}
                                                />
                                                {errors.department && <span className="text-red-500 text-xs ml-1">{errors.department}</span>}
                                            </div>

                                            <div>
                                                <TextInputNew1
                                                    name="Chamber no"
                                                    value={chamberNo}
                                                    setValue={setChamberNo}
                                                    readOnly={readOnly}
                                                    required={isCurrentEmployeeDoctor(employeeCategory)}
                                                    // disabled={childRecord.current > 0}
                                                />
                                            </div>

                                            <div className="">
                                                <DateInputNew
                                                    name="Joining Date"
                                                    value={joiningDate}
                                                    setValue={setJoiningDate}
                                                    required={true}
                                                    readOnly={readOnly}
                                                    disabled={childRecord.current > 0}
                                                    type={"date"}

                                                />
                                                {errors.joiningDate && <span className="text-red-500 text-xs ml-1">{errors.joiningDate}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-md border border-gray-200 h-[250px]">
                                        <h3 className="font-medium text-gray-800 mb-2 text-sm">Additional Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <TextInputNew1
                                                    name="Father Name"
                                                    value={fatherName}
                                                    setValue={setFatherName}

                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />
                                                {errors.fatherName && <span className="text-red-500 text-xs ml-1">{errors.fatherName}</span>}
                                            </div>

                                            <div>
                                                <DropdownInputNew
                                                    name="Marital Status"
                                                    options={maritalStatusList}
                                                    value={maritalStatus}
                                                    setValue={setMaritalStatus}
                                                    required
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />
                                                {errors.maritalStatus && <span className="text-red-500 text-xs ml-1">{errors.maritalStatus}</span>}
                                            </div>

                                            <div>
                                                <TextInputNew
                                                    name="Pan No"
                                                    value={panNo}
                                                    setValue={setPanNo}

                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />
                                                {errors.panNo && <span className="text-red-500 text-xs ml-1">{errors.panNo}</span>}
                                            </div>

                                            <div>
                                                <TextInputNew1
                                                    name="Degree"
                                                    value={degree}
                                                    setValue={setDegree}

                                                    readOnly={readOnly}
                                                />
                                                {errors.degree && <span className="text-red-500 text-xs ml-1">{errors.degree}</span>}
                                            </div>

                                            <div className="md:col-span-2">
                                                <TextInputNew1
                                                    name="Specialization"
                                                    value={specialization}
                                                    setValue={setSpecialization}

                                                    readOnly={readOnly}
                                                />
                                                {errors.specialization && <span className="text-red-500 text-xs ml-1">{errors.specialization}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-3">
                                    <div className="bg-white p-3 rounded-md border border-gray-200">
                                        <h3 className="font-medium text-gray-800 mb-2 text-sm">Bank Details</h3>
                                        <div className="space-y-2">
                                            <div className="col-span-1">
                                                <TextInputNew1
                                                    name="Bank Name"
                                                    value={bankName}
                                                    setValue={setBankName}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <TextInputNew1
                                                    name="Branch Name"
                                                    value={branchName}
                                                    setValue={setbranchName}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />
                                            </div>


                                            <div className="grid grid-cols-2 gap-2">
                                                <TextInputNew
                                                    name="IFSC No"
                                                    value={ifscNo}
                                                    setValue={setIfscNo}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />

                                                <TextInputNew
                                                    name="Account No"
                                                    type="number"
                                                    value={accountNo}
                                                    setValue={setAccountNo}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />

                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 rounded-md border border-gray-200 sticky h-[250px]">
                                        <h3 className="font-medium text-gray-800 mb-2 text-sm">Contact Information</h3>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <TextInputNew
                                                    name="Mobile No"
                                                    type="number"
                                                    value={mobile}
                                                    setValue={setMobile}
                                                    required={true}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />

                                                <TextInputNew
                                                    name="Email Id"
                                                    type="email"
                                                    value={email}
                                                    setValue={setEmail}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                />
                                            </div>

                                            <TextAreaNew
                                                name="Address"
                                                rows="2"
                                                value={localAddress}
                                                setValue={setlocalAddress}
                                                required
                                                readOnly={readOnly}
                                                // disabled={childRecord.current > 0}
                                            />
                                            {errors.localAddress && <span className="text-red-500 text-xs ml-1">{errors.localAddress}</span>}

                                            <div className="grid grid-cols-2 gap-2">
                                                <TextInputNew
                                                    name="Pincode"
                                                    type="number"
                                                    value={permPincode}
                                                    setValue={setPermPincode}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                    required
                                                />
                                                <DropdownInputNew
                                                    name="City/State"
                                                    options={dropDownListMergedObject(
                                                        (cityList?.data || []).filter((item) => id || item.active),
                                                        "name",
                                                        "id"
                                                    )}
                                                    value={permCity}
                                                    setValue={setPermCity}
                                                    readOnly={readOnly}
                                                    // disabled={childRecord.current > 0}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>

                    <Modal isOpen={cameraOpen} onClose={() => setCameraOpen(false)}>
                        <LiveWebCam
                            picture={image}
                            setPicture={setImage}
                            onClose={() => setCameraOpen(false)}
                        />
                    </Modal>

                    <Modal isOpen={leavingForm} onClose={() => setLeavingForm(false)}>
                        <EmployeeLeavingForm
                            leavingReason={leavingReason}
                            setLeavingReason={setLeavingReason}
                            leavingDate={leavingDate}
                            setLeavingDate={setLeavingDate}
                            canRejoin={canRejoin}
                            setCanRejoin={setCanRejoin}
                            rejoinReason={rejoinReason}
                            setRejoinReason={setRejoinReason}
                            onSubmit={submitLeavingForm}
                            onClose={() => setLeavingForm(false)}
                        />
                    </Modal>
                </Modal>
            )}
        </div>
    );
}