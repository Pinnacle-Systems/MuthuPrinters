import { useEffect, useState } from "react"
import { TextInputNew, ToggleButton } from "../../../Inputs"
import { statusDropdown } from "../../../Utils/DropdownData";
import { useAddPackingControlMutation, useDeletePackingControlMutation, useGetPackingControlByIdQuery, useGetPackingControlQuery, useUpdatePackingControlMutation } from "../../../redux/uniformService/PackingControl";
import { params } from "../../../Utils/helper";
import { toast } from "react-toastify";



const Packing = () => {

  const [id, setId] = useState("")
  const [form, setForm] = useState(false);
  const [active, setActive] = useState(true);
  const [packingPercentage, setPackingPercentage] = useState("")
  const [readOnly, setReadOnly] = useState(false);

  const { data: allData, isLoading, isFetching } = useGetPackingControlQuery({ params });
  const { data: singleData, isFetching: isSingleFetching, isLoading: isSingleLoading } = useGetPackingControlByIdQuery(id, { skip: !id });

  const [addData] = useAddPackingControlMutation();
  const [updateData] = useUpdatePackingControlMutation();
  const [removeData] = useDeletePackingControlMutation();


  const data = {
    active,
    packingPercentage,
    id
  }

  const handleSubmitCustom = async (callback, data, text) => {
    try {
      let returnData = await callback(data).unwrap();
      setId(returnData.data.id)
      // syncFormWithDb(undefined)
      toast.success(text + "Successfully");

    } catch (error) {
      console.log("handle")
    }
  }



  const saveData = () => {
    if (!packingPercentage) {
      toast.error("packingPercentage is missing", { position: "top-center" })
      return
    }

    if (!window.confirm("Are you sure save the details ...?")) {
      return
    }
    if (id) {
      handleSubmitCustom(updateData, data, "Updated")
    } else {
      handleSubmitCustom(addData, data, "Added")
    }
  }

  useEffect(() => {
    if (allData?.data?.length > 0) {
      setId(allData?.data[0].id)
      setActive(allData?.data[0].active)
      setPackingPercentage(allData?.data[0].packingPercentage)
    }
  }, [allData, isLoading, isFetching])

  return (
    <>
      <fieldset className=' rounded mt-2 p-5'>
        <div className=''>

          <div className='mb-5  w-64'>
            <TextInputNew name="Packing Percenatage" value={packingPercentage} setValue={setPackingPercentage} required={true} readOnly={readOnly} />
          </div>

          {/* <div className='mb-5'>
            <ToggleButton name="Status" options={statusDropdown} value={active} setActive={setActive} required={true} readOnly={readOnly} />
          </div> */}

        </div>
        <div className='flex p-2'>
          <button
            onClick={() => saveData()}
            type="button"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save
          </button>
        </div>
      </fieldset>
    </>
  )
}


export default Packing



