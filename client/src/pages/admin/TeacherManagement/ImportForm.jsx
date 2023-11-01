import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
 
import { useGetTenantsQuery } from "../../../store/services/tenants";
import { useImportDataMutation } from "../../../store/services/request";
import { FileImportValidation } from "./TeacherSchemaValidation.jsx";
import { useFormik } from "formik"; 
import LoadingHoc from "../../../hocs/LoadingHoc";
import { useDispatch } from "react-redux";
import { useAuth } from "../../../hooks/useAuth";
import { Xselect, Xinput, Xtable, Xbutton } from "../../../components/common/Forms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { toast } from "react-toastify";

const ImportForm = ({ tenantIdDefault, csvFileDefault , showConfirmButton, handleCloseForm , onImporCsvChecked ,onImporCsvSuccess, setLoading }) => {
  const dispatch = useDispatch();
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const auth = useAuth();
  const [time, setTime] = useState(new Date().getTime()); 
  const [checkingImportData, resultCheckingImportData] = useImportDataMutation(); 
  const [importData, resultImportData] = useImportDataMutation(); 
  const [csvFileImport, setCsvFileImport] = useState(csvFileDefault || null)
  const [csvDatas, setCsvData] = useState(); 
  const [isAllValid,setIsAllValid] = useState(false);
  const [errorsValidation,setErrorValidation] = useState(false);
  const [tenantLinkType,setTenantLinkType] = useState(false);

  const [filter, setFilter] = useState({
    per_page: 10,
    page: 1,
    order: [],
    keyword: '',
    tenant_id: auth.user.data.tenant_id || tenantIdDefault,
    school_id: auth.user.data.school_id
  })

  useEffect(() => {
    setTitle(t('admin.teachers.title'))
  }, []);

  useEffect(()=>{
      setCsvFileImport(csvFileDefault)
  },[csvFileDefault?.length])

  const countData = csvDatas?.length

  useEffect(() => {
    if(csvDatas){
       checkingValid()
    }
  },[countData,csvDatas,csvFileImport?.lastModified])
  
  const checkingValid = async () =>{
    const errors = [];
    await Promise.all(csvDatas.map((item,index)=>{ 
        if(Object.keys(item.errors).length > 0 ){
          errors.push(item)
        }
    }))
 
    setTimeout(()=>{ 
      setErrorValidation(errors)
      if(errors && errors.length === 0){
        setIsAllValid(true)  
      }else{
        toast.error(t('admin.teachers.alert.csv_found_invalid'), {
            position: "bottom-left",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            draggable: true,
            progress: undefined,
        })
      }
    },500)
  }
  
  const formik_import_csv = useFormik({
    initialValues: {
      file: '',  
      tenant_id: filter?.tenant_id,
    },
    validationSchema: FileImportValidation,
    onSubmit: (values,actions) => {  
      let csv = document.getElementById("file").files[0];

      if(csv && (csv.type != 'text/csv') && (csv.type != 'application/vnd.ms-excel'))
        return actions.setErrors({file:t('admin.validation.csv_only')})

      const formData = new FormData()
      
      formData.append('file',csv)
      formData.append('tenant_id',values.tenant_id)

      setCsvFileImport(csv)

      checkingImportData({
        endpoint: 'teachers/checking-import-csv',
        params: formData,
        time
      });
    }
  }); 
  
  const handleSubmitImport = () =>{

    if(!formik_import_csv.values.tenant_id && !csvFileImport){
      return console.log('nofile');
    }

    let csv = document.getElementById("file").files[0];
    
    if(csv && (csv.type != 'text/csv') && (csv.type != 'application/vnd.ms-excel'))
      return actions.setErrors({file:t('admin.validation.csv_only')})

    const formData = new FormData()
    
    formData.append('file',csvFileImport) 
    formData.append('tenant_id',formik_import_csv.values.tenant_id)

    setCsvFileImport(csv)

    importData({
      endpoint: 'teachers/import-csv',
      params: formData,
      time
    });
  }
 
  const tenants = useGetTenantsQuery({
    no_lti : true
  });
  
  useEffect(()=>{ 
    if(tenants?.data?.data?.rows){
      const getDetailTenant = tenants?.data?.data?.rows.find(o => o.id == filter.tenant_id);
      if(getDetailTenant && getDetailTenant.linkage_type)
        setTenantLinkType(getDetailTenant.linkage_type)
    }
  },[tenants?.data?.data?.rows])

  useEffect(()=>{
    setCsvData(null)
    setFilter((oldObject)=>({ ...oldObject, page: 1 }))
  },[formik_import_csv?.values?.file,formik_import_csv?.values?.tenant_id])

  useEffect(()=>{
      setLoading(resultCheckingImportData?.isLoading)
  },[resultCheckingImportData?.isLoading])
   
  useEffect(()=>{
    if(resultCheckingImportData?.isSuccess == true){ 
        resultCheckingImportData.csv_file = csvFileImport
        resultCheckingImportData.tenant_id = formik_import_csv.values.tenant_id
        resultCheckingImportData.link_type = tenantLinkType

        onImporCsvChecked(resultCheckingImportData)
        setCsvData(resultCheckingImportData?.data?.data)
    }
  },[resultCheckingImportData?.isSuccess])
 
  useEffect(()=>{
    if(resultCheckingImportData?.isSuccess == true){  
        onImporCsvSuccess()
        setCsvData(null)
    }
  },[resultImportData?.isSuccess])

  return (
    <div className="flex flex-row justify-between items-end w-full"> 
        <form 
            formik={formik_import_csv}
            onSubmit={formik_import_csv.handleSubmit}
        >

            <div className={`${auth.user.data.role != 'superadmin' ? `hidden` : ''} mb-2`}>
                <Xselect
                    id="tenant_id"
                    name="tenant_id"
                    data={tenants?.data?.data?.rows}
                    label={(<>{t('admin.teachers.label.tenant')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)}
                    placeholder={t('placeholder.select_tenant')}
                    formik={formik_import_csv}
                    defaultValue={false}
                    onChange={(e) => {
                    formik_import_csv.setFieldValue('tenant_id', (e) ? e.id : '')
                    formik_import_csv.setFieldValue('linkage_type', (e) ? e.linkage_type : '')
                    setTenantLinkType((old) => (e) ? e.linkage_type : old)

                    formik_import_csv.setTouched({
                        ...formik_import_csv.touched,
                        'tenant_id': false
                    }, true)
                    }}
                />
            </div>
    
          <Xinput  
            formik={formik_import_csv} 
            name="file"  
            required id="file" type='file' label={(<>{t('admin.teachers.label.select_csv_file')}<span className="text-red-600 ml-1">{t('form.label.mandatory')}</span></>)} placeholder={t('placeholder.select_csv_file')}/>
            
            <div className="flex flex-row justify-between mt-2">  
                 <div>
                  <button
                    type="button"
                    onClick={() => handleCloseForm()}
                    className="
                      bg-gradient-to-r from-white to-gray-200 focus:shadow-outline focus:outline-none text-teal-600
                      shadow 
                      focus:shadow-outline 
                      focus:outline-none 
                      text-white font-bold py-2 px-4 rounded
                      min-w-max
                      self-center
                      mr-2 
                    "
                    >
                      <FontAwesomeIcon icon="fa fa-close" className="text-md"/>&nbsp;
                      {t('admin.teachers.btn.close_import_btn')}
                  </button> 
                 </div>
                <div key={isAllValid+'-buttonActionDynamic'}> 
                    {
                      ((isAllValid == true) && csvDatas && errorsValidation.length == 0) ?
                      <div className="flex justify-end">
                        <Xbutton type="button" onClick={() => handleSubmitImport(null)} >
                          <FontAwesomeIcon icon="fa fa-download" className="text-md font-bold"/>&nbsp;
                          {t('admin.teachers.btn.confim_submit_import_csv')}
                        </Xbutton>
                      </div> 
                      :
                      <button
                        className="
                            bg-gradient-to-r from-teal-400 to-teal-600 shadow 
                            hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
                            ml-3 
                            shadow 
                            focus:shadow-outline 
                            focus:outline-none 
                            text-white font-bold py-2 px-4 rounded
                            min-w-max
                            self-center
                        "
                        >
                            <FontAwesomeIcon icon="fa fa-file-excel" className="text-md"/>&nbsp;
                            {t('admin.teachers.btn.submit_csv_data')} 
                      </button>
                    } 
                </div>
            </div>
        </form>
    </div>
  );
}

export default LoadingHoc(ImportForm);
