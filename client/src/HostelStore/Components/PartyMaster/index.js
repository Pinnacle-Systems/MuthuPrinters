import React, { useEffect, useState, useRef, useCallback } from "react";

import secureLocalStorage from "react-secure-storage";
import {
  useGetPartyQuery,
  useGetPartyByIdQuery,
  useAddPartyMutation,
  useUpdatePartyMutation,
  useDeletePartyMutation,
  useLazyGetPartyByIdQuery,
} from "../../../redux/services/PartyMasterService";

import { useGetCityQuery } from "../../../redux/services/CityMasterService";

import FormHeader from "../../../Basic/components/FormHeader";
import FormReport from "../../../Basic/components/FormReportTemplate";
import { toast } from "react-toastify";
import {
  TextInput,
  DropdownInput,
  CheckBox,
  RadioButton,
  TextArea,
  DateInput,
  MultiSelectDropdown,
  ReusableTable,
  TextInputNew,
  DropdownInputNew,
  ToggleButton,
  TextAreaNew,
  TextInputNew1,
} from "../../../Inputs";
import ReportTemplate from "../../../Basic/components/ReportTemplate";
import {
  dropDownListObject,
  dropDownListMergedObject,
  multiSelectOption,
} from "../../../Utils/contructObject";
import moment from "moment";
import Modal from "../../../UiComponents/Modal";

import { Loader } from "../../../Basic/components";
import { useDispatch, useSelector } from "react-redux";
import { findFromList, renameFile } from "../../../Utils/helper";
import { Check, LayoutGrid, Paperclip, Plus, Power, Table } from "lucide-react";
import { statusDropdown } from "../../../Utils/DropdownData";
import ArtDesignReport from "./ArtDesignReport";
import Swal from "sweetalert2";
import { getImageUrlPath } from "../../../Constants";
import { push } from "../../../redux/features/opentabs";
import AddBranch from "./AddBranch";
import { useGetbranchTypeQuery } from "../../../redux/services/BranchTypeMaster";
import { useGetPartyBranchByIdQuery } from "../../../redux/services/PartyBranchMasterService";

export default function Form({ partyId, onCloseForm, childId }) {
  const [form, setForm] = useState(false);

  const [readOnly, setReadOnly] = useState(false);

  const [id, setId] = useState("");
  const [panNo, setPanNo] = useState("");
  const [name, setName] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tinNo, setTinNo] = useState("");
  const [cstNo, setCstNo] = useState("");
  const [cinNo, setCinNo] = useState("");
  const [faxNo, setFaxNo] = useState("");
  const [website, setWebsite] = useState("");
  const [code, setCode] = useState("");
  const [soa, setSoa] = useState("");
  const [coa, setCoa] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [costCode, setCostCode] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [cstDate, setCstDate] = useState("");
  const [email, setEmail] = useState("");
  const [isSupplier, setIsSupplier] = useState(false);
  const [isCustomer, setIsCustomer] = useState(true);
  const [isBranch, setIsBranch] = useState(false);

  const [active, setActive] = useState(true);
  const [view, setView] = useState("all");
  const [isClient, setClient] = useState();
  const [partyCode, setPartyCode] = useState("");
  const [landMark, setlandMark] = useState("");
  const [country, setCountry] = useState("");
  const [contact, setContact] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [parentId, setParentId] = useState("");

  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [alterContactNumber, setAlterContactNumber] = useState("");
  const [bankname, setBankName] = useState("");
  const [bankBranchName, setBankBranchName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [formReport, setFormReport] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [reportName, setReportName] = useState("Customer/Supplier Name");
  const [searchValue, setSearchValue] = useState("");
  const [msmeNo, setMsmeNo] = useState("");
  const [companyAlterNumber, setCompanyAlterNumber] = useState("");
  const [branchModelOpen, setBranchModelOpen] = useState(false);
  const [branchForm, setBranchForm] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [branchTypeId, setBranchTypeId] = useState("");

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
    // isParent: true
  };
  const {
    data: cityList,
    isLoading: cityLoading,
    isFetching: cityFetching,
  } = useGetCityQuery({ params });
  const { data: branchTypeData } = useGetbranchTypeQuery({});

  const {
    data: allData,
    isLoading,
    isFetching,
  } = useGetPartyQuery({ params, searchParams: searchValue });

  const {
    data: singleData,
    isFetching: isSingleFetching,
    isLoading: isSingleLoading,
  } = useGetPartyByIdQuery(id, { skip: !id });
  const [trigger, { data: LazyData }] = useLazyGetPartyByIdQuery();

  const [addData] = useAddPartyMutation();
  const [updateData] = useUpdatePartyMutation();
  const [removeData] = useDeletePartyMutation();

  const syncFormWithDb = useCallback(
    (data) => {
      setPanNo(data?.panNo ? data?.panNo : "");
      setName(data?.name ? data?.name : "");

      setAliasName(data?.aliasName ? data?.aliasName : "");

      setDisplayName(data?.displayName ? data?.displayName : "");
      setAddress(data?.address ? data?.address : "");
      setTinNo(data?.tinNo ? data?.tinNo : "");
      setCstNo(data?.cstNo ? data?.cstNo : "");
      setCinNo(data?.cinNo ? data?.cinNo : "");
      setFaxNo(data?.faxNo ? data?.faxNo : "");
      setCinNo(data?.cinNo ? data?.cinNo : "");
      setCoa(data?.coa ? data?.coa : "");
      setSoa(data?.soa ? data?.soa : "");

      setContactPersonName(
        data?.contactPersonName ? data?.contactPersonName : "",
      );
      setGstNo(data?.gstNo ? data?.gstNo : "");
      setCostCode(data?.costCode ? data?.costCode : "");
      setCstDate(
        data?.cstDate ? moment.utc(data?.cstDate).format("YYYY-MM-DD") : "",
      );
      setCode(data?.code ? data?.code : "");
      setPincode(data?.pincode ? data?.pincode : "");
      setWebsite(data?.website ? data?.website : "");
      setEmail(data?.email ? data?.email : "");
      setCity(data?.cityId ? data?.cityId : "");
      setIsSupplier(data?.isSupplier ? data.isSupplier : false);
      setIsCustomer(id ? (data?.isCustomer ? data.isCustomer : false) : true);
      setActive(id ? (data?.active ? data.active : false) : true);
      setContactMobile(data?.contactMobile ? data.contactMobile : "");
      setlandMark(data?.landMark ? data?.landMark : "");
      setContact(data?.contact ? data?.contact : "");
      setDesignation(data?.designation ? data?.designation : "");
      setDepartment(data?.department ? data?.department : "");
      setContactPersonEmail(
        data?.contactPersonEmail ? data?.contactPersonEmail : "",
      );
      setContactNumber(data?.contactNumber ? data?.contactNumber : "");
      setAlterContactNumber(
        data?.alterContactNumber ? data?.alterContactNumber : "",
      );
      setBankName(data?.bankname ? data?.bankname : "");
      setBankBranchName(data?.bankBranchName ? data?.bankBranchName : "");
      setAccountNumber(data?.accountNumber ? data?.accountNumber : "");
      setIfscCode(data?.ifscCode ? data?.ifscCode : "");
      setAttachments(data?.attachments ? data?.attachments : []);
      setMsmeNo(data?.msmeNo ? data?.msmeNo : "");
      setCompanyAlterNumber(
        data?.companyAlterNumber ? data?.companyAlterNumber : "",
      );
      setPartyCode(data?.partyCode ? data?.partyCode : "");
      setIsBranch(data?.isBranch ? data?.isBranch : false);
      childRecord.current = data?.childRecord ? data?.childRecord : 0;

      setParentId(data?.parentId ? data?.parentId : "");
      setBranchTypeId(data?.branchTypeId ? data?.branchTypeId : "");
      setIsBranch(data?.isBranch ? data?.isBranch : "");
    },
    [id],
  );

  useEffect(() => {
    syncFormWithDb(singleData?.data);
  }, [isSingleFetching, isSingleLoading, id, syncFormWithDb, singleData]);

  const {
    data: singleBranchData,
    isFetching: singleBranchFetching,
    isLoading: singleBranchLoading,
  } = useGetPartyBranchByIdQuery(parentId, {
    skip: id,
  });

  const syncFormWithDbNew = useCallback(
    (data) => {
      if (!parentId) return;

      setPanNo(data?.panNo ? data?.panNo : "");
      // setAliasName(data?.aliasName ? data?.aliasName : "");
      // setlandMark(data?.landMark ? data?.landMark : '')
      // setCity(data?.cityId ? data?.cityId : "");
      // setPincode(data?.pincode ? data?.pincode : "");

      setDisplayName(data?.displayName ? data?.displayName : "");
      setTinNo(data?.tinNo ? data?.tinNo : "");
      setCstNo(data?.cstNo ? data?.cstNo : "");
      setCinNo(data?.cinNo ? data?.cinNo : "");
      setFaxNo(data?.faxNo ? data?.faxNo : "");
      setCinNo(data?.cinNo ? data?.cinNo : "");
      setCoa(data?.coa ? data?.coa : "");
      setSoa(data?.soa ? data?.soa : "");

      // setContactPersonName(data?.contactPersonName ? data?.contactPersonName : "");
      setGstNo(data?.gstNo ? data?.gstNo : "");
      setCostCode(data?.costCode ? data?.costCode : "");
      setCstDate(
        data?.cstDate ? moment.utc(data?.cstDate).format("YYYY-MM-DD") : "",
      );
      setCode(data?.code ? data?.code : "");
      setWebsite(data?.website ? data?.website : "");
      setEmail(data?.email ? data?.email : "");
      setIsSupplier(data?.isSupplier ? data.isSupplier : false);
      setIsCustomer(data?.isCustomer ? data.isCustomer : true);
      // setActive(id ? (data?.active ? data.active : false) : true);
      setContactMobile(data?.contactMobile ? data.contactMobile : "");
      setContact(data?.contact ? data?.contact : "");
      // setDesignation(data?.designation ? data?.designation : "")
      // setDepartment(data?.department ? data?.department : "")
      // setContactPersonEmail(data?.contactPersonEmail ? data?.contactPersonEmail : "")
      // setContactNumber(data?.contactNumber ? data?.contactNumber : "")
      // setAlterContactNumber(data?.alterContactNumber ? data?.alterContactNumber : "")
      setBankName(data?.bankname ? data?.bankname : "");
      setBankBranchName(data?.bankBranchName ? data?.bankBranchName : "");
      setAccountNumber(data?.accountNumber ? data?.accountNumber : "");
      setIfscCode(data?.ifscCode ? data?.ifscCode : "");
      setAttachments(data?.attachments ? data?.attachments : []);
      setMsmeNo(data?.msmeNo ? data?.msmeNo : "");
      setCompanyAlterNumber(
        data?.companyAlterNumber ? data?.companyAlterNumber : "",
      );
      setPartyCode(data?.partyCode ? data?.partyCode : "");
      // setParentId(data?.parentId ? data?.parentId : "")
      // childRecord.current = data?.childRecord ? data?.childRecord : 0;
    },
    [parentId],
  );

  useEffect(() => {
    syncFormWithDbNew(singleBranchData?.data);
  }, [
    singleBranchFetching,
    singleBranchLoading,
    parentId,
    syncFormWithDbNew,
    singleBranchData,
  ]);

  const data = {
    name,
    isSupplier,
    isCustomer,
    code,
    aliasName,
    displayName,
    address,
    cityId: city,
    pincode,
    panNo,
    tinNo,
    cstNo,
    cstDate,
    cinNo,
    faxNo,
    email,
    website,
    contactPersonName,
    gstNo,
    costCode,
    contactMobile,
    active,
    companyId,
    coa: coa ? coa : "",
    soa,
    id,
    userId,
    landMark,
    contact,
    designation,
    department,
    contactPersonEmail,
    contactNumber,
    alterContactNumber,
    bankname,
    bankBranchName,
    accountNumber,
    ifscCode,
    attachments: attachments?.filter((i) => i.filePath),
    msmeNo,
    companyAlterNumber,
    partyCode,
    parentId,
    isBranch,
    branchTypeId,
  };

  const validateData = (data) => {
    return (
      data.name &&
      data?.active &&
      data?.address &&
      data?.cityId &&
      data?.pincode &&
      data?.gstNo &&
      data?.partyCode
    );
  };

  const handleSubmitCustom = async (callback, data, text, nextProcess) => {
    try {
      const formData = new FormData();
      for (let key in data) {
        if (key == "attachments") {
          console.log("attachments =>", data[key]);
          formData.append(
            key,
            JSON.stringify(
              data[key].map((i) => ({
                ...i,
                filePath:
                  i.filePath instanceof File ? i.filePath.name : i.filePath,
              })),
            ),
          );
          data[key].forEach((option) => {
            if (option?.filePath instanceof File) {
              formData.append("images", option.filePath);
            }
          });
        } else {
          formData.append(key, data[key]);
        }
      }

      let returnData;
      if (text === "Updated") {
        returnData = await callback({ id, body: formData }).unwrap();
      } else {
        returnData = await callback(formData).unwrap();
      }
      dispatch({
        type: `accessoryItemMaster/invalidateTags`,
        payload: ["AccessoryItemMaster"],
      });
      dispatch({
        type: `CityMaster/invalidateTags`,
        payload: ["City/State Name"],
      });
      dispatch({
        type: `CurrencyMaster/invalidateTags`,
        payload: ["Currency"],
      });
      if (nextProcess == "new") {
        syncFormWithDb(undefined);
        onNew();
        countryNameRef?.current?.focus();
      } else {
        if (partyId) {
          onCloseForm();
        }
        setForm(false);
      }

      Swal.fire({
        title: text + "  " + "Successfully",
        icon: "success",
      });
    } catch (error) {
      console.log("handle");
    }
  };
  const today = new Date();

  function addNewComments() {
    setAttachments((prev) => [...prev, { log: "", date: today, filePath: "" }]);
    // setDueDate(moment.utc(today).format("YYYY-MM-DD"));
  }

  function handleInputChange(value, index, field) {
    const newBlend = structuredClone(attachments);
    newBlend[index][field] = value;
    setAttachments(newBlend);
    // setDueDate(moment.utc(today).format("YYYY-MM-DD"));
  }

  function deleteRow(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function openPreview(filePath) {
    window.open(
      filePath instanceof File
        ? URL.createObjectURL(filePath)
        : getImageUrlPath(filePath),
    );
  }

  useEffect(() => {
    if (attachments?.length >= 1) return;
    setAttachments((prev) => {
      let newArray = Array.from({ length: 1 - prev?.length }, () => {
        return { date: today, filePath: "", log: "" };
      });
      return [...prev, ...newArray];
    });
  }, [setAttachments, attachments]);
  const countryNameRef = useRef(null);

  useEffect(() => {
    if (form && countryNameRef.current) {
      countryNameRef.current.focus();
    }
  }, [form]);
  const alphaNum12 = /^[A-Z0-9]{15}$/;
  const saveData = (nextProcess) => {
    if (isBranch) {
      if (!parentId) {
        Swal.fire({
          text: `Choose  the Parent Customer/supplier `,
          icon: "warning",
          customClass: {
            popup: "swal-custom-height",
          },
        });
        return false;
      }
      if (!branchTypeId) {
        Swal.fire({
          text: `Choose the Branch Type`,
          icon: "warning",
          customClass: {
            popup: "swal-custom-height",
          },
        });
        return false;
      }
    }

    if (!validateData(data)) {
      Swal.fire({
        title: "Please fill all required fields...!",
        icon: "error",
      });
      return;
    }
    if (gstNo && !alphaNum12.test(gstNo.toUpperCase())) {
      Swal.fire({
        title: "Invalid GST Number",
        text: "Must be exactly 15 alphanumeric characters",
        icon: "error",
      });
      return;
    }
    if (!isCustomer && !isSupplier) {
      Swal.fire({
        title: "Please Select Customer or Supplier",
        icon: "error",
      });
      return;
    }

    let foundItem;

    if (isBranch) {
      if (id) {
        foundItem = allData?.data
          ?.filter((i) => i.id != id)
          ?.some(
            (item) =>
              item.branchTypeId == branchTypeId && item.parentId == parentId,
          );
      } else {
        foundItem = allData?.data?.some(
          (item) =>
            item.branchTypeId == branchTypeId && item.parentId == parentId,
        );
      }
    } else {
      if (id) {
        foundItem = allData?.data
          ?.filter((i) => i.id != id)
          ?.some((item) => item.name == name && item.gstNo == gstNo);
      } else {
        foundItem = allData?.data?.some(
          (item) => item.name == name && item.gstNo == gstNo,
        );
      }
    }

    if (isBranch) {
      if (foundItem) {
        Swal.fire({
          text: `The Branch name is already  exists `,
          icon: "warning",
          customClass: {
            popup: "swal-custom-height",
          },
        });
        return false;
      }
    } else {
      if (foundItem) {
        Swal.fire({
          text: `The ${isSupplier ? "Supplier" : "Customer"} name is already  exists `,
          icon: "warning",
          customClass: {
            popup: "swal-custom-height",
          },
        });
        return false;
      }
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
      if (!window.confirm("Are you sure to delete.   ..?")) {
        return;
      }
      if (data?.data?.childRecord > 0) {
        Swal.fire({
          icon: "error",
          title: "Child Record Exists",
          text: "Data cannot be deleted!",
        });
      } else {
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
          dispatch({
            type: `accessoryItemMaster/invalidateTags`,
            payload: ["AccessoryItemMaster"],
          });
          setId("");
          dispatch({
            type: `CityMaster/invalidateTags`,
            payload: ["City/State Name"],
          });
          dispatch({
            type: `CurrencyMaster/invalidateTags`,
            payload: ["Currency"],
          });
          syncFormWithDb(undefined);
          Swal.fire({
            title: "Deleted Successfully",
            icon: "success",
          });
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
    setReadOnly(false);
    setForm(true);
    setSearchValue("");
    setId("");
    syncFormWithDb(undefined);
  };

  function onDataClick(id) {
    setId(id);
    setForm(true);
  }
  const tableHeaders = ["Name", "Alias Name"];
  const tableDataNames = ["dataObj.name", "dataObj.aliasName"];

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

  // useEffect(() => {
  //     if (!partyId) return
  //     if (partyId == "new") {
  //         onNew()
  //     }
  //     else {
  //         setId(partyId);
  //     }
  //     // if (childId) {
  //     //     branchModelOpen(true)
  //     //     setBranchId(childId)
  //     // }
  //     // if (openModelForAddress) {
  //     //   setIsAddressExpanded(true);
  //     // }
  // }, [partyId]);

  useEffect(() => {
    if (!partyId) return;

    if (partyId === "new") {
      onNew();
      return;
    } else if (!childId) {
      setId(partyId);
      setForm(true);
    }

    // // existing party
    // setId(partyId);
    // setForm(true);

    // open branch modal if childId exists
    if (childId) {
      setBranchModelOpen(true);
      setBranchForm(false);
      setBranchId(childId);
    }
  }, [partyId, childId]);

  const columns = [
    {
      header: "S.No",
      accessor: (item, index) => index + 1,
      className: "font-medium text-gray-900 w-12  text-center",
    },
    {
      header: "Category",
      accessor: (item, index) => (item?.isCustomer ? "Customer" : "Supplier"),
      className: "font-medium text-gray-900 w-18 uppercase text-left pl-2",
    },

    {
      header: reportName,
      accessor: (item) => item?.name,
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-left uppercase w-2/4",
    },
    {
      header: "Branch Type",
      accessor: (item) => item?.BranchType?.name || "-",
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-left uppercase w-40 pl-2",
    },

    {
      header: "Status",
      accessor: (item) => (item.active ? ACTIVE : INACTIVE),
      //   cellClass: () => "font-medium text-gray-900",
      className: "font-medium text-gray-900 text-center uppercase w-16",
    },
  ];

  const handleChange = (type) => {
    setIsSupplier(type == "supplier");
    setIsCustomer(type == "client");
  };

  if (!cityList || cityFetching || cityLoading) {
    return <Loader />;
  }

  let filterParty;

  if (view == "Customer") {
    filterParty = allData?.data?.filter((item) => item.isCustomer);
  }
  if (view === "Supplier") {
    filterParty = allData?.data?.filter((item) => item.isSupplier);
  }
  if (view == "all") {
    filterParty = allData?.data;
  }
  //   const { data: currencyList } = useGetCurrencyMasterQuery({ params });

  if (partyId) {
    return (
      <>
        <div className="h-full flex flex-col bg-gray-200 ">
          <div className="border-b py-2 px-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white mt-3 ">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-semibold text-gray-800">
                {id
                  ? !readOnly
                    ? "Edit Customer/Supplier"
                    : "Customer/Supplier Master"
                  : "Add New Customer/Supplier"}
              </h2>
            </div>

            <div className="flex gap-2">
              <div className="flex gap-2">
                {/* <div className="  ">
                                    <button
                                        onClick={() => {
                                            if (id) {
                                                setBranchModelOpen(true)
                                                setBranchForm(false)
                                            }

                                            else {
                                                Swal.fire({
                                                    icon: 'warning',
                                                    title: `Save the ${isSupplier ? "Supplier Details" : "Customer Details"} `,
                                                    showConfirmButton: false,
                                                });
                                            }

                                        }}
                                        readOnly={readOnly}
                                        className="bg-white border text-xs border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Add Branch
                                    </button>
                                </div> */}
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
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4 space-y-3 ">
                <div className="bg-white p-3 rounded-md border border-gray-200 h-[330px] overflow-y-auto">
                  <h3 className="font-medium text-gray-800 mb-2 text-sm">
                    Basic Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-row items-center gap-4 col-span-2 mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isCustomer}
                          onChange={(e) => setIsCustomer(e.target.checked)}
                          disabled={readOnly}
                        />
                        <label className="block text-xs font-bold text-gray-600">
                          Customer
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSupplier}
                          onChange={(e) => setIsSupplier(e.target.checked)}
                          disabled={readOnly}
                        />
                        <label className="block text-xs font-bold text-gray-600">
                          Supplier
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isBranch}
                          onChange={(e) => {
                            if (parentId || branchTypeId) {
                              setParentId("");
                              setBranchTypeId("");
                            }
                            setIsBranch(e.target.checked);
                          }}
                          disabled={readOnly}
                        />
                        <label className="block text-xs font-bold text-gray-600">
                          Is Branch
                        </label>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <DropdownInputNew
                        name="Customer/supplier"
                        options={dropDownListObject(
                          id
                            ? allData?.data?.filter(
                                (i) => i.id != id && !i.parentId,
                              )
                            : allData?.data?.filter(
                                (item) =>
                                  item.active &&
                                  item.id != id &&
                                  !item.parentId,
                              ),
                          "name",
                          "id" || [],
                        )}
                        value={parentId}
                        setValue={(value) => {
                          setParentId(value);
                          setName(findFromList(value, allData?.data, "name"));
                        }}
                        // setValue={setParentId}
                        readOnly={readOnly}
                        required={true}
                        disabled={childRecord.current > 0 || !isBranch}
                      />
                    </div>
                    <div className="col-span-2">
                      <DropdownInputNew
                        name="Branch Type"
                        options={dropDownListObject(
                          id
                            ? branchTypeData?.data
                            : branchTypeData?.data?.filter(
                                (item) => item.active,
                              ),
                          "name",
                          "id" || [],
                        )}
                        value={branchTypeId}
                        openOnFocus={true}
                        setValue={(value) => {
                          setBranchTypeId(value);
                        }}
                        required={true}
                        readOnly={readOnly}
                        disabled={
                          childRecord.current > 0 || !isBranch || !parentId
                        }
                      />
                    </div>
                    {!isBranch && (
                      <div className="col-span-2">
                        <TextInputNew1
                          name={"name"}
                          type="text"
                          value={name}
                          inputClass="h-8"
                          ref={countryNameRef}
                          setValue={setName}
                          required={true}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                          onBlur={(e) => {
                            if (aliasName) return;
                            setAliasName(e.target.value);
                          }}
                          className="focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    {isBranch && (
                      <div className="col-span-2">
                        <TextAreaNew
                          name="Branch Name"
                          inputClass="h-10"
                          value={name}
                          setValue={setName}
                          required={true}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                        />
                      </div>
                    )}
                    {/* <div className="col-span-2">
                                                    <TextInputNew1
                                                        name="Alias Name"
                                                        type="text"
                                                        inputClass="h-8"
                                                        value={aliasName}
                                                        setValue={setAliasName}
                                                        readOnly={readOnly}
                                                        disabled={childRecord.current > 0}
                                                        className="focus:ring-2 focus:ring-blue-100"
                                                    />
                                                </div> */}
                    <div className="col-span-1">
                      <TextInputNew1
                        name="Code"
                        type="text"
                        value={partyCode}
                        setValue={setPartyCode}
                        readOnly={readOnly}
                        disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100 w-10"
                      />
                    </div>

                    <div className=" ml-2">
                      <ToggleButton
                        name="Status"
                        options={statusDropdown}
                        value={active}
                        setActive={setActive}
                        required={true}
                        readOnly={readOnly}
                        className="bg-gray-100 p-1 rounded-lg"
                        activeClass="bg-[#f1f1f0] shadow-sm text-blue-600"
                        inactiveClass="text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-3 ">
                <div className="bg-white p-3 rounded-md border border-gray-200 h-[330px] overflow-y-auto">
                  <h3 className="font-medium text-gray-800 mb-2 text-sm">
                    Address Details
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <TextAreaNew
                          name="Address"
                          inputClass="h-10"
                          value={address}
                          setValue={setAddress}
                          required={true}
                          readOnly={readOnly}
                          d
                          isabled={childRecord.current > 0}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="grid grid-cols-5 gap-2">
                          <div className="col-span-5">
                            <TextInputNew1
                              name="Land Mark"
                              type="text"
                              value={landMark}
                              setValue={setlandMark}
                              readOnly={readOnly}
                              disabled={childRecord.current > 0}
                              className="focus:ring-2 focus:ring-blue-100 w-10"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className=" grid grid-cols-5 gap-3">
                          <div className="col-span-4">
                            <DropdownInputNew
                              name="City/State Name"
                              options={dropDownListMergedObject(
                                id
                                  ? cityList?.data
                                  : cityList?.data?.filter(
                                      (item) => item.active,
                                    ),
                                "name",
                                "id",
                              )}
                              country={country}
                              masterName="CITY MASTER"
                              // lastTab={activeTab}
                              value={city}
                              setValue={setCity}
                              required={true}
                              readOnly={readOnly}
                              disabled={childRecord.current > 0}
                              className="focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                          <TextInputNew1
                            name="Pincode"
                            type="number"
                            value={pincode}
                            required={true}
                            setValue={setPincode}
                            readOnly={readOnly}
                            disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100 w-10"
                          />
                        </div>
                      </div>

                      {/* <div className="">
                                                        <TextInputNew
                                                            name={"Contact Number"}
                                                            value={contact}

                                                            setValue={setContact}
                                                            readOnly={readOnly}
                                                            disabled={childRecord.current > 0}
                                                            className="focus:ring-2 focus:ring-blue-100 w-10"
                                                        />
                                                    </div>
                                                    <div className="">
                                                        <TextInputNew1
                                                            name={"Email"}
                                                            type="text"
                                                            value={email}

                                                            setValue={setEmail}
                                                            readOnly={readOnly}
                                                            disabled={childRecord.current > 0}
                                                            className="focus:ring-2 focus:ring-blue-100 w-10"
                                                        />

                                                    </div> */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-white p-3 rounded-md border border-gray-200  h-[330px]">
                  <h3 className="font-medium text-gray-800 mb-2 text-sm">
                    Contact Details
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="">
                        <TextInputNew1
                          name="Contact Person Name"
                          type="text"
                          value={contactPersonName}
                          setValue={setContactPersonName}
                          readOnly={readOnly}
                          // disabled={childRecord.current > 0}
                          className="focus:ring-2 focus:ring-blue-100 w-10"
                        />
                      </div>

                      <TextInputNew1
                        name="Designation"
                        type="text"
                        value={designation}
                        setValue={setDesignation}
                        readOnly={readOnly}
                        // disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100 w-10"
                      />
                      <TextInputNew1
                        name="Department"
                        type="text"
                        value={department}
                        setValue={setDepartment}
                        readOnly={readOnly}
                        // disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100 w-10"
                      />
                      <div className="col-span-1">
                        <TextInputNew
                          name="Email"
                          type="text"
                          value={contactPersonEmail}
                          setValue={setContactPersonEmail}
                          readOnly={readOnly}
                          // disabled={childRecord.current > 0}
                          className="focus:ring-2 focus:ring-blue-100 w-10"
                        />
                      </div>
                      <div className="col-span-2">
                        <TextInputNew
                          name="Contact Number"
                          value={contactNumber}
                          setValue={setContactNumber}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                          className="focus:ring-2 focus:ring-blue-100 w-10"
                        />
                      </div>
                      {/* <div className='col-span-1'>
                                                        <TextInputNew
                                                            name="Alternative Contact Number"
                                                            type="number"
                                                            value={alterContactNumber}
                                                            setValue={setAlterContactNumber}

                                                            // readOnly={readOnly}
                                                            // disabled={childRecord.current > 0}
                                                            className="focus:ring-2 focus:ring-blue-100 w-10"
                                                        />
                                                    </div> */}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3">
                <div className="bg-white p-3 rounded-md border border-gray-200 h-[240px]">
                  <h3 className="font-medium text-gray-800 mb-2 text-sm">
                    Business Details
                  </h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* <DropdownInput
                                                    name="Currency"
                                                    options={dropDownListObject(
                                                        id
                                                            ? currencyList?.data ?? []
                                                            : currencyList?.data?.filter(
                                                                (item) => item.active
                                                            ) ?? [],
                                                        "name",
                                                        "id"
                                                    )}
                                                    // lastTab={activeTab}
                                                    masterName="CURRENCY MASTER"
                                                    value={currency}
                                                    setValue={setCurrency}
                                                    readOnly={readOnly}
                                                    disabled={childRecord.current > 0}
                                                    className="focus:ring-2 focus:ring-blue-100"
                                                /> */}

                      {/* <DropdownInput
                                                    name="PayTerm"
                                                    options={dropDownListObject(
                                                        id
                                                            ? payTermList?.data
                                                            : payTermList?.data?.filter((item) => item.active),
                                                        "name",
                                                        "id"
                                                    )}
                                                    value={payTermDay}
                                                    setValue={setPayTermDay}
                                                    // required={true}
                                                    readOnly={readOnly}
                                                    disabled={childRecord.current > 0}
                                                    className="focus:ring-2 focus:ring-blue-100"
                                                /> */}
                      <TextInputNew
                        name="Pan No"
                        type="pan_no"
                        value={panNo}
                        setValue={setPanNo}
                        readOnly={readOnly}
                        disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100"
                      />
                      <TextInputNew
                        name="GST No"
                        type="text"
                        value={gstNo}
                        setValue={setGstNo}
                        readOnly={readOnly}
                        required={true}
                        disabled={parentId || isBranch}
                        className="focus:ring-2 focus:ring-blue-100"
                      />
                      <TextInputNew
                        name="MSME CERTFICATE  No"
                        type="text"
                        value={msmeNo}
                        setValue={setMsmeNo}
                        readOnly={readOnly}
                        disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100"
                      />
                      <TextInputNew
                        name="CIN No"
                        type="text"
                        value={cinNo}
                        setValue={setCinNo}
                        readOnly={readOnly}
                        disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-white p-3 rounded-md border border-gray-200 h-[240px]">
                  <h3 className="font-medium text-gray-800 mb-2 text-sm">
                    Bank Details
                  </h3>
                  <div className="space-y-2">
                    <TextInputNew1
                      name="Bank Name"
                      type="text"
                      value={bankname}
                      setValue={setBankName}
                      readOnly={readOnly}
                      disabled={childRecord.current > 0}
                      className="focus:ring-2 focus:ring-blue-100 w-10"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <TextInputNew1
                          name="Branch Name"
                          type="text"
                          value={bankBranchName}
                          setValue={setBankBranchName}
                          readOnly={readOnly}
                          disabled={childRecord.current > 0}
                          className="focus:ring-2 focus:ring-blue-100 w-10"
                        />
                      </div>

                      <TextInputNew
                        name="Account Number"
                        type="text"
                        value={accountNumber}
                        setValue={setAccountNumber}
                        readOnly={readOnly}
                        disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100 w-10"
                      />
                      <TextInputNew
                        name="IFSC CODE"
                        type="text"
                        value={ifscCode}
                        setValue={setIfscCode}
                        readOnly={readOnly}
                        disabled={childRecord.current > 0}
                        className="focus:ring-2 focus:ring-blue-100 w-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-white p-3 rounded-md border border-gray-200  h-[240px]">
                  <h3 className="font-medium text-gray-800 mb-2 text-sm">
                    Attachments
                  </h3>

                  <div className="max-h-[200px] overflow-auto">
                    <div className="grid grid-cols-1 gap-3  border-collapse bg-[#F1F1F0]   shadow-sm overflow-auto">
                      <table className="bg-gray-200 text-gray-800 text-sm table-auto w-full">
                        <thead className=" py-2  font-medium  top-o sticky">
                          <tr>
                            <th className="py-2  text-xs  w-10 text-center border-r border-white/50">
                              S.No
                            </th>
                            {/* <th className="py-2  font-medium  w-24 text-center border-r border-white/50">Date</th> */}
                            {/* <th className="py-1 px-3 w-32 text-left border border-gray-400">User</th> */}
                            <th className="py-2  text-xs w-60 center border-white/50">
                              {" "}
                              Name
                            </th>
                            <th className="py-2  text-xs center w-60 border-r border-white/50">
                              File
                            </th>
                            <th className="py-2  text-xs  w-10 text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {attachments?.map((item, index) => (
                            <tr
                              key={index}
                              className={`hover:bg-gray-50 transition-colors border-b   border-gray-200 text-[12px] ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-100"
                              }`}
                            >
                              <td className="border-r border-white/50 center h-8 text-center ">
                                {index + 1}
                              </td>

                              <td className=" border-r border-white/50' h-8 ">
                                <input
                                  type="text"
                                  className="text-left rounded py-1 px-2 w-full  focus:outline-none focus:ring focus:border-blue-300"
                                  value={item?.name}
                                  onChange={(e) =>
                                    handleInputChange(
                                      e.target.value,
                                      index,
                                      "name",
                                    )
                                  }
                                />
                              </td>
                              <td className="border-r border-white/50 h-8">
                                <div className="flex items-center gap-2">
                                  {/* Hidden File Input */}
                                  {!readOnly && !item.filePath && (
                                    <>
                                      <input
                                        type="file"
                                        id={`file-upload-${index}`}
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files[0]) {
                                            handleInputChange(
                                              renameFile(e.target.files[0]),
                                              index,
                                              "filePath",
                                            );
                                          }
                                        }}
                                      />

                                      {/* Attach Icon */}
                                      <label
                                        htmlFor={`file-upload-${index}`}
                                        className="cursor-pointer flex items-center justify-center p-1 bg-gray-100 rounded hover:bg-gray-200"
                                        title="Attach file"
                                      >
                                        📎
                                      </label>
                                    </>
                                  )}

                                  {/* Show File + Actions */}
                                  {item.filePath && (
                                    <>
                                      <span className="truncate max-w-[120px]">
                                        {item.filePath?.name ?? item.filePath}
                                      </span>

                                      <button
                                        onClick={() =>
                                          openPreview(item.filePath)
                                        }
                                        className="text-blue-600 text-xs hover:underline"
                                      >
                                        View
                                      </button>

                                      {!readOnly && (
                                        <button
                                          onClick={() =>
                                            handleInputChange(
                                              "",
                                              index,
                                              "filePath",
                                            )
                                          }
                                          className="text-red-600 text-xs"
                                          title="Remove file"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>

                              <td className="w-[30px] border-gray-200 h-8">
                                <div className="flex items-center justify-center gap-1">
                                  {/* Add Button */}
                                  <button
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addNewComments();
                                      }
                                    }}
                                    onClick={addNewComments}
                                    className="flex items-center px-1 bg-blue-50 rounded"
                                  >
                                    <Plus size={18} className="text-blue-800" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    className="flex items-center px-1 bg-red-50 rounded"
                                    onClick={() => deleteRow(index)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 text-red-800"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={branchModelOpen}
          form={form}
          widthClass={"w-[90%] h-[89%]"}
          setBranchModelOpen={setBranchModelOpen}
          onClose={() => {
            setBranchModelOpen(false);
          }}
        >
          <AddBranch
            cityList={cityList}
            setReadOnly={setReadOnly}
            partyId={partyId}
            branchForm={branchForm}
            setBranchForm={setBranchForm}
            branchTypeData={branchTypeData}
            companyId={companyId}
            readOnly={readOnly}
            isCustomer={isCustomer}
            isSupplier={isSupplier}
            branchId={branchId}
            setBranchId={setBranchId}
          />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div onKeyDown={handleKeyDown}>
        <div className="w-full  mx-auto rounded-md shadow-lg px-2 py-1 overflow-y-auto mt-1">
          <div className="w-full flex justify-between mb-2 items-center px-0.5">
            <h1 className="text-lg font-bold text-gray-800">
              Customer/Supplier Master{" "}
            </h1>
            <div className="flex items-center gap-4 text-md">
              <button
                onClick={() => {
                  setForm(true);
                  onNew();
                  // syncFormWithDb(undefined)
                  // syncFormWithDbNew(undefined)
                  setParentId("");
                }}
                className="bg-white border text-xs border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
              >
                <Plus size={12} />
                <span className=" ">Add New Customer/Supplier</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setView("all");
                    setReportName("Customer/Supplier Name");
                  }}
                  className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${
                    view === "all"
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Table size={16} />
                  All
                </button>
                <button
                  onClick={() => {
                    setView("Customer");
                    setReportName("Customer Name");
                  }}
                  className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${
                    view === "Customer"
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Table size={16} />
                  Customer
                </button>
                <button
                  onClick={() => {
                    setView("Supplier");
                    setReportName("Supplier Name");
                  }}
                  className={`px-3 py-1 rounded-md text-xs flex items-center gap-1 ${
                    view === "Supplier"
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <LayoutGrid size={16} />
                  Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* <Mastertable
                    // header={'Party list'}
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    onDataClick={onDataClick}
                    tableHeaders={tableHeaders}
                    tableDataNames={tableDataNames}
                    data={allData?.data}
                    loading={
                        isLoading || isFetching
                    }
                    setReadOnly={setReadOnly}
                    deleteData={deleteData}
                /> */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-3 w-">
          <ReusableTable
            columns={columns}
            data={filterParty || []}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={deleteData}
            itemsPerPage={15}
          />
        </div>

        {form === true && (
          <Modal
            isOpen={form}
            form={form}
            widthClass={"w-[90%] h-[99%]"}
            onClose={() => {
              setForm(false);
              syncFormWithDb(undefined);
              syncFormWithDbNew(undefined);
              setId("");
            }}
          >
            <div className="h-full flex flex-col bg-gray-200 ">
              <div className="border-b py-2 px-4 mx-3 flex justify-between items-center sticky top-0 z-10 bg-white mt-3 ">
                <div className="flex items-center gap-2">
                  <h2 className="text-md font-semibold text-gray-800">
                    {id
                      ? !readOnly
                        ? "Edit Customer/Supplier"
                        : "Customer/Supplier Master"
                      : "Add New Customer/Supplier"}
                  </h2>
                </div>

                <div className="flex gap-2">
                  {/* <div className="  ">
                                        <button
                                            onClick={() => {
                                                if (id) {
                                                    setBranchModelOpen(true)
                                                    setBranchForm(false)
                                                }

                                                else {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: `Save the ${isSupplier ? "Supplier Details" : "Customer Details"} `,
                                                        showConfirmButton: false,
                                                    });
                                                }

                                            }}
                                            readOnly={readOnly}
                                            className="bg-white border text-xs border-indigo-600 text-indigo-600 hover:bg-indigo-700 hover:text-white px-4 py-1 rounded-md shadow transition-colors duration-200 flex items-center gap-2"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            Add Branch
                                        </button>
                                    </div> */}
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
              </div>

              <div className="flex-1 overflow-auto p-3">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-4 space-y-3 ">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-[330px] overflow-y-auto">
                      <h3 className="font-medium text-gray-800 mb-2 text-sm">
                        Basic Details
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-row items-center gap-4 col-span-2 mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isCustomer}
                              onChange={(e) => setIsCustomer(e.target.checked)}
                              disabled={readOnly}
                            />
                            <label className="block text-xs font-bold text-gray-600">
                              Customer
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSupplier}
                              onChange={(e) => setIsSupplier(e.target.checked)}
                              disabled={readOnly}
                            />
                            <label className="block text-xs font-bold text-gray-600">
                              Supplier
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isBranch}
                              onChange={(e) => {
                                if (parentId || branchTypeId) {
                                  setParentId("");
                                  setBranchTypeId("");
                                  setName("");
                                }
                                setIsBranch(e.target.checked);
                              }}
                              disabled={readOnly}
                            />
                            <label className="block text-xs font-bold text-gray-600">
                              Add Branch
                            </label>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <DropdownInputNew
                            name="Customer/supplier"
                            options={dropDownListObject(
                              id
                                ? allData?.data?.filter(
                                    (i) => i.id != id && !i.parentId,
                                  )
                                : allData?.data?.filter(
                                    (item) =>
                                      item.active &&
                                      item.id != id &&
                                      !item.parentId,
                                  ),
                              "name",
                              "id",
                            )}
                            value={parentId}
                            setValue={(value) => {
                              setParentId(value);
                              setName(
                                findFromList(value, allData?.data, "name"),
                              );
                            }}
                            // setValue={setParentId}
                            readOnly={readOnly}
                            required={true}
                            disabled={childRecord.current > 0 || !isBranch}
                          />
                        </div>
                        <div className="col-span-2">
                          <DropdownInputNew
                            name="Branch Type"
                            options={dropDownListObject(
                              id
                                ? branchTypeData?.data
                                : branchTypeData?.data?.filter(
                                    (item) => item.active,
                                  ),
                              "name",
                              "id" || [],
                            )}
                            value={branchTypeId}
                            openOnFocus={true}
                            setValue={(value) => {
                              setBranchTypeId(value);
                            }}
                            required={true}
                            readOnly={readOnly}
                            disabled={
                              childRecord.current > 0 || !isBranch || !parentId
                            }
                          />
                        </div>
                        {!isBranch && (
                          <div className="col-span-2">
                            <TextInputNew1
                              name={`${isSupplier ? "Supplier Name" : "Customer Name"}`}
                              type="text"
                              value={name}
                              inputClass="h-8"
                              ref={countryNameRef}
                              setValue={setName}
                              required={true}
                              readOnly={readOnly}
                              disabled={childRecord.current > 0}
                              onBlur={(e) => {
                                if (aliasName) return;
                                setAliasName(e.target.value);
                              }}
                              className="focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        )}

                        {isBranch && (
                          <div className="col-span-2">
                            <TextInputNew1
                              name="Branch Name"
                              inputClass="h-10"
                              value={name}
                              setValue={setName}
                              required={true}
                              readOnly={readOnly}
                              disabled={childRecord.current > 0}
                            />
                          </div>
                        )}
                        {/* <div className="col-span-2">
                                                    <TextInputNew1
                                                        name="Alias Name"
                                                        type="text"
                                                        inputClass="h-8"
                                                        value={aliasName}
                                                        setValue={setAliasName}
                                                        readOnly={readOnly}
                                                        disabled={childRecord.current > 0}
                                                        className="focus:ring-2 focus:ring-blue-100"
                                                    />
                                                </div> */}
                        <div className="col-span-1">
                          <TextInputNew1
                            name="Code"
                            type="text"
                            value={partyCode}
                            required={true}
                            setValue={setPartyCode}
                            readOnly={readOnly}
                            disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100 w-10"
                          />
                        </div>

                        <div className=" ml-2">
                          <ToggleButton
                            name="Status"
                            options={statusDropdown}
                            value={active}
                            setActive={setActive}
                            required={true}
                            readOnly={readOnly}
                            className="bg-gray-100 p-1 rounded-lg"
                            activeClass="bg-[#f1f1f0] shadow-sm text-blue-600"
                            inactiveClass="text-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-3 ">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-[330px] overflow-y-auto">
                      <h3 className="font-medium text-gray-800 mb-2 text-sm">
                        Address Details
                      </h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <TextAreaNew
                              name="Address"
                              inputClass="h-10"
                              value={address}
                              setValue={setAddress}
                              required={true}
                              readOnly={readOnly}
                              d
                              isabled={childRecord.current > 0}
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="grid grid-cols-5 gap-2">
                              <div className="col-span-5">
                                <TextInputNew1
                                  name="Land Mark"
                                  type="text"
                                  value={landMark}
                                  setValue={setlandMark}
                                  readOnly={readOnly}
                                  // disabled={childRecord.current > 0}
                                  className="focus:ring-2 focus:ring-blue-100 w-10"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className=" grid grid-cols-5 gap-3">
                              <div className="col-span-4">
                                <DropdownInputNew
                                  name="City/State Name"
                                  options={dropDownListMergedObject(
                                    id
                                      ? cityList?.data
                                      : cityList?.data?.filter(
                                          (item) => item.active,
                                        ),
                                    "name",
                                    "id",
                                  )}
                                  country={country}
                                  masterName="CITY MASTER"
                                  // lastTab={activeTab}
                                  value={city}
                                  setValue={setCity}
                                  required={true}
                                  readOnly={readOnly}
                                  // disabled={childRecord.current > 0}
                                  className="focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                              <TextInputNew1
                                name="Pincode"
                                type="number"
                                value={pincode}
                                required={true}
                                setValue={setPincode}
                                readOnly={readOnly}
                                // disabled={childRecord.current > 0}
                                className="focus:ring-2 focus:ring-blue-100 w-10"
                              />
                            </div>
                          </div>

                          {/* <div className="">
                                                        <TextInputNew
                                                            name={"Contact Number"}
                                                            value={contact}

                                                            setValue={setContact}
                                                            readOnly={readOnly}
                                                            disabled={childRecord.current > 0}
                                                            className="focus:ring-2 focus:ring-blue-100 w-10"
                                                        />
                                                    </div>
                                                    <div className="">
                                                        <TextInputNew1
                                                            name={"Email"}
                                                            type="text"
                                                            value={email}

                                                            setValue={setEmail}
                                                            readOnly={readOnly}
                                                            disabled={childRecord.current > 0}
                                                            className="focus:ring-2 focus:ring-blue-100 w-10"
                                                        />

                                                    </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200  h-[330px]">
                      <h3 className="font-medium text-gray-800 mb-2 text-sm">
                        Contact Details
                      </h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="">
                            <TextInputNew1
                              name="Contact Person Name"
                              type="text"
                              value={contactPersonName}
                              setValue={setContactPersonName}
                              readOnly={readOnly}
                              // disabled={childRecord.current > 0}
                              className="focus:ring-2 focus:ring-blue-100 w-10"
                            />
                          </div>

                          <TextInputNew1
                            name="Designation"
                            type="text"
                            value={designation}
                            setValue={setDesignation}
                            readOnly={readOnly}
                            // disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100 w-10"
                          />
                          <TextInputNew1
                            name="Department"
                            type="text"
                            value={department}
                            setValue={setDepartment}
                            readOnly={readOnly}
                            // disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100 w-10"
                          />
                          <div className="col-span-1">
                            <TextInputNew
                              name="Email"
                              type="text"
                              value={contactPersonEmail}
                              setValue={setContactPersonEmail}
                              readOnly={readOnly}
                              // disabled={childRecord.current > 0}
                              className="focus:ring-2 focus:ring-blue-100 w-10"
                            />
                          </div>
                          <div className="col-span-2">
                            <TextInputNew
                              name="Contact Number"
                              value={contactNumber}
                              setValue={setContactNumber}
                              readOnly={readOnly}
                              // disabled={childRecord.current > 0}
                              className="focus:ring-2 focus:ring-blue-100 w-10"
                            />
                          </div>
                          {/* <div className='col-span-1'>
                                                        <TextInputNew
                                                            name="Alternative Contact Number"
                                                            type="number"
                                                            value={alterContactNumber}
                                                            setValue={setAlterContactNumber}

                                                            // readOnly={readOnly}
                                                            // disabled={childRecord.current > 0}
                                                            className="focus:ring-2 focus:ring-blue-100 w-10"
                                                        />
                                                    </div> */}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-[240px]">
                      <h3 className="font-medium text-gray-800 mb-2 text-sm">
                        Business Details
                      </h3>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* <DropdownInput
                                                    name="Currency"
                                                    options={dropDownListObject(
                                                        id
                                                            ? currencyList?.data ?? []
                                                            : currencyList?.data?.filter(
                                                                (item) => item.active
                                                            ) ?? [],
                                                        "name",
                                                        "id"
                                                    )}
                                                    // lastTab={activeTab}
                                                    masterName="CURRENCY MASTER"
                                                    value={currency}
                                                    setValue={setCurrency}
                                                    readOnly={readOnly}
                                                    disabled={childRecord.current > 0}
                                                    className="focus:ring-2 focus:ring-blue-100"
                                                /> */}

                          {/* <DropdownInput
                                                    name="PayTerm"
                                                    options={dropDownListObject(
                                                        id
                                                            ? payTermList?.data
                                                            : payTermList?.data?.filter((item) => item.active),
                                                        "name",
                                                        "id"
                                                    )}
                                                    value={payTermDay}
                                                    setValue={setPayTermDay}
                                                    // required={true}
                                                    readOnly={readOnly}
                                                    disabled={childRecord.current > 0}
                                                    className="focus:ring-2 focus:ring-blue-100"
                                                /> */}
                          <TextInputNew
                            name="Pan No"
                            type="pan_no"
                            value={panNo}
                            setValue={setPanNo}
                            readOnly={readOnly}
                            // disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100"
                          />
                          <TextInputNew
                            name="GST No"
                            type="text"
                            value={gstNo}
                            setValue={setGstNo}
                            readOnly={readOnly || parentId || isBranch}
                            required={true}
                            disabled={parentId || isBranch}
                            className="focus:ring-2 focus:ring-blue-100"
                          />
                          <TextInputNew
                            name="MSME CERTFICATE  No"
                            type="text"
                            value={msmeNo}
                            setValue={setMsmeNo}
                            readOnly={readOnly}
                            // disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100"
                          />
                          <TextInputNew
                            name="CIN No"
                            type="text"
                            value={cinNo}
                            setValue={setCinNo}
                            readOnly={readOnly}
                            className="focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200 h-[240px]">
                      <h3 className="font-medium text-gray-800 mb-2 text-sm">
                        Bank Details
                      </h3>
                      <div className="space-y-2">
                        <TextInputNew1
                          name="Bank Name"
                          type="text"
                          value={bankname}
                          setValue={setBankName}
                          readOnly={readOnly}
                          // disabled={childRecord.current > 0}
                          className="focus:ring-2 focus:ring-blue-100 w-10"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2">
                            <TextInputNew1
                              name="Branch Name"
                              type="text"
                              value={bankBranchName}
                              setValue={setBankBranchName}
                              readOnly={readOnly}
                              // disabled={childRecord.current > 0}
                              className="focus:ring-2 focus:ring-blue-100 w-10"
                            />
                          </div>

                          <TextInputNew
                            name="Account Number"
                            type="text"
                            value={accountNumber}
                            setValue={setAccountNumber}
                            readOnly={readOnly}
                            // disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100 w-10"
                          />
                          <TextInputNew
                            name="IFSC CODE"
                            type="text"
                            value={ifscCode}
                            setValue={setIfscCode}
                            readOnly={readOnly}
                            // disabled={childRecord.current > 0}
                            className="focus:ring-2 focus:ring-blue-100 w-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-3">
                    <div className="bg-white p-3 rounded-md border border-gray-200  h-[240px]">
                      <h3 className="font-medium text-gray-800 mb-2 text-sm">
                        Attachments
                      </h3>

                      <div className="max-h-[200px] overflow-auto">
                        <div className="grid grid-cols-1 gap-3  border-collapse bg-[#F1F1F0]   shadow-sm overflow-auto">
                          <table className="bg-gray-200 text-gray-800 text-sm table-auto w-full">
                            <thead className=" py-2  font-medium  top-o sticky">
                              <tr>
                                <th className="py-2  text-xs  w-10 text-center border-r border-white/50">
                                  S.No
                                </th>
                                {/* <th className="py-2  font-medium  w-24 text-center border-r border-white/50">Date</th> */}
                                {/* <th className="py-1 px-3 w-32 text-left border border-gray-400">User</th> */}
                                <th className="py-2  text-xs w-60 center border-white/50">
                                  {" "}
                                  Name
                                </th>
                                <th className="py-2  text-xs center w-60 border-r border-white/50">
                                  File
                                </th>
                                <th className="py-2  text-xs  w-10 text-center">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {attachments?.map((item, index) => (
                                <tr
                                  key={index}
                                  className={`hover:bg-gray-50 transition-colors border-b   border-gray-200 text-[12px] ${
                                    index % 2 === 0 ? "bg-white" : "bg-gray-100"
                                  }`}
                                >
                                  <td className="border-r border-white/50 center h-8 text-center ">
                                    {index + 1}
                                  </td>

                                  <td className=" border-r border-white/50' h-8 ">
                                    <input
                                      type="text"
                                      className="text-left rounded py-1 px-2 w-full  focus:outline-none focus:ring focus:border-blue-300"
                                      value={item?.name}
                                      onChange={(e) =>
                                        handleInputChange(
                                          e.target.value,
                                          index,
                                          "name",
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="border-r border-white/50 h-8">
                                    <div className="flex items-center gap-2">
                                      {/* Hidden File Input */}
                                      {!readOnly && !item.filePath && (
                                        <>
                                          <input
                                            type="file"
                                            id={`file-upload-${index}`}
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files[0]) {
                                                handleInputChange(
                                                  renameFile(e.target.files[0]),
                                                  index,
                                                  "filePath",
                                                );
                                              }
                                            }}
                                          />

                                          {/* Attach Icon */}
                                          <label
                                            htmlFor={`file-upload-${index}`}
                                            className="cursor-pointer flex items-center justify-center p-1 bg-gray-100 rounded hover:bg-gray-200"
                                            title="Attach file"
                                          >
                                            📎
                                          </label>
                                        </>
                                      )}

                                      {/* Show File + Actions */}
                                      {item.filePath && (
                                        <>
                                          <span className="truncate max-w-[120px]">
                                            {item.filePath?.name ??
                                              item.filePath}
                                          </span>

                                          <button
                                            onClick={() => {
                                              if (
                                                item.filePath instanceof File
                                              ) {
                                                window.open(
                                                  URL.createObjectURL(
                                                    item.filePath,
                                                  ),
                                                );
                                              } else {
                                                window.open(
                                                  getImageUrlPath(
                                                    item.filePath,
                                                  ),
                                                );
                                              }
                                            }}
                                            className="text-blue-600 text-xs hover:underline"
                                          >
                                            View
                                          </button>

                                          {!readOnly && (
                                            <button
                                              onClick={() =>
                                                handleInputChange(
                                                  "",
                                                  index,
                                                  "filePath",
                                                )
                                              }
                                              className="text-red-600 text-xs"
                                              title="Remove file"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  <td className="w-[30px] border-gray-200 h-8">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* Add Button */}
                                      <button
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            addNewComments();
                                          }
                                        }}
                                        onClick={addNewComments}
                                        className="flex items-center px-1 bg-blue-50 rounded"
                                      >
                                        <Plus
                                          size={18}
                                          className="text-blue-800"
                                        />
                                      </button>

                                      {/* Delete Button */}
                                      <button
                                        className="flex items-center px-1 bg-red-50 rounded"
                                        onClick={() => deleteRow(index)}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4 text-red-800"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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
      <Modal
        isOpen={formReport}
        onClose={() => setFormReport(false)}
        widthClass={"p-3 h-[70%] w-[70%]"}
      >
        <ArtDesignReport
          // userRole={userRole}
          setFormReport={setFormReport}
          tableWidth="100%"
          formReport={formReport}
          setAttachments={setAttachments}
          attachments={attachments}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
        />
      </Modal>
      <Modal
        isOpen={branchModelOpen}
        form={form}
        widthClass={"w-[90%] h-[89%]"}
        setBranchModelOpen={setBranchModelOpen}
        onClose={() => {
          setBranchModelOpen(false);
        }}
      >
        <AddBranch
          cityList={cityList}
          setReadOnly={setReadOnly}
          partyId={id}
          branchForm={branchForm}
          setBranchForm={setBranchForm}
          branchTypeData={branchTypeData}
          companyId={companyId}
          readOnly={readOnly}
          isCustomer={isCustomer}
          isSupplier={isSupplier}
          branchId={branchId}
          setBranchId={setBranchId}
          parentName={name}
          parentPanNo={panNo}
          parentGstNo={gstNo}
          parentMsme={msmeNo}
          parentCinNo={cinNo}
        />
      </Modal>
    </>
  );
}
