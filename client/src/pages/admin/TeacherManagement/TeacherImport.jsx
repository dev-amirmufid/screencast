import { useEffect, useState } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useDeleteDataMutation, useGetDataQuery, useStoreDataMutation, useExportDataMutation, useImportDataMutation } from "../../../store/services/request";

import { TeacherSchemaValidation, FileImportValidation } from "./TeacherSchemaValidation.jsx";
import { useFormik } from "formik";

import LoadingHoc from "../../../hocs/LoadingHoc";
import { useDispatch } from "react-redux";

import { useAuth } from "../../../hooks/useAuth";
import { Xtable } from "../../../components/common/Forms";
import ImportForm from './ImportForm'

const TeacherManagement = ({ setLoading }) => {
  const navigate = useNavigate();

  const location = useLocation();
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const auth = useAuth();
  const [time, setTime] = useState(new Date().getTime());
  const [importData, resultImportData] = useImportDataMutation();
  const [csvDatas, setCsvData] = useState([])
  const [csvFile, setCsvFile] = useState()
  const [csvFilteringDatas, setCsvFilteringData] = useState([])
  const [firstLoad, setFirstLoad] = useState(true)

  const [filter, setFilter] = useState({
    per_page: 10,
    page: 1,
    order: [],
    keyword: '',
    tenant_id: auth.user.data.tenant_id,
    school_id: auth.user.data.school_id
  })

  useEffect(() => {
    setTitle(t('admin.teachers.title'))
  }, []);

  function collactionPaginate(array, page_size, page_number) {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
  }

  useEffect(() => {
    if (csvDatas) {
      setCsvFilteringData(collactionPaginate(csvDatas, filter.per_page, filter.page))
    }
  }, [filter?.page, csvDatas]);
  
  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false)
    } else {
      setCsvData(location?.state?.payload)
      setCsvFile(location?.state?.csv_file)
      setFilter((oldObject) => ({ ...oldObject, tenant_id: location?.state?.tenant_id }))
    }
  }, [location?.state?.payload]);

  const formik_import_csv = useFormik({
    initialValues: {
      file: '',
      tenant_id: filter?.tenant_id,
    },
    validationSchema: FileImportValidation,
    onSubmit: (values, actions) => {
      let csv = document.getElementById("file").files[0];

      if (csv && (csv.type != 'text/csv') && (csv.type != 'application/vnd.ms-excel'))
        return actions.setErrors({ file: t('admin.validation.csv_only') })

      const formData = new FormData()

      formData.append('file', csv)
      formData.append('tenant_id', values.tenant_id)

      importData({
        endpoint: 'teachers/import-csv',
        params: formData,
        time
      });
    }
  });

  const teachers = useGetDataQuery({
    endpoint: 'teachers',
    params: filter,
    time
  }, {
    skip: !filter.school_id || !filter.tenant_id
  });

  useEffect(() => {
    if (resultImportData?.isSuccess == true) {
      formik_import_csv.resetForm()
      setCsvData(null)
      setCsvFilteringData(null)
      navigate('/admin/teacher-management')
    }
  }, [resultImportData?.isSuccess])



  const onImporCsvSuccess = () => {
    setCsvData(null)
    navigate('/admin/teacher-management')
  }

  const Tooltip = ({ message, children }) => {
    const [showHover, setShowHover] = useState(false)
    return (
      <div
        onMouseEnter={() => setShowHover(true)}
        onMouseLeave={() => setShowHover(false)}
        className="group relative flex cursor-pointer">
        <div >
          {children}
        </div>
        {
          message &&
          <span className={
            `absolute bottom-8 text-center scale-0 rounded bg-gray-800 p-2 text-xs text-white cursor-pointer
              ${showHover ? 'group-hover:scale-100 visible' : 'visible-none'}
              ${showHover ? 'transition ease-in-out delay-150  hover:-translate-y-1 hover:scale-110 duration-300' : 'invisible'}
              `}>{message}</span>
        }
      </div>
    )
  }

  const RenderRowTable = ({ row, keyRow }) => {
    return (
      <div
        className={` 
          flex-col w-full
          ${row.errors[keyRow] && !row[keyRow] ? 'cursor-pointer py-2 rounded border-red-400 bg-red-500 text-white px-2' : 'bg-transparent'}
          `
        }>
        <Tooltip message={t(row.errors[keyRow])} >
          <span
            className={`
                cursor-pointer 
                ${row.errors[keyRow] ? 'border-red-400 bg-red-500 text-white px-2' : 'bg-transparent'}
                rounded  
                focus:outline-none 
                focus:bg-white 
                focus:border-teal-500 focus:ring-teal-500 
                min-w-full
              `}
          >
            {row[keyRow]}
          </span>
        </Tooltip>
      </div>
    )
  }

  const renderTable = () => {

    const dataColumns = [
      {
        name: t('admin.teachers.label.no'),
        width: "5vw",
        center: true,
        cell: (row, index) => ((filter.page - 1) * filter.per_page) + (index + 1)
      },
      {
        name: t('admin.tenants.label.tenant_name'),
        cell: (row) => {
          return <RenderRowTable keyRow={'tenant_name'} row={row} />
        },
        sortable: false,
        sortField: 'tenant_name'
      },
      {
        name: t('admin.schools.label.name'),
        cell: (row) => {
          return <RenderRowTable keyRow={'school_name'} row={row} />
        },
        sortable: false,
        sortField: 'school_name'
      },
      {
        name: t('admin.teachers.label.name'),
        cell: (row) => {
          return <RenderRowTable keyRow={'first_name'} row={row} />
        },
        sortable: false,
        sortField: 'first_name'
      },
      {
        name: t('admin.teachers.label.userid'),
        cell: (row) => {
          return <RenderRowTable keyRow={'username'} row={row} />
        },
        sortable: false,
        sortField: 'username'
      },
      {
        name: t('admin.teachers.label.email'),
        cell: (row) => {
          return <RenderRowTable keyRow={'email'} row={row} />
        },
        sortable: false,
        sortField: 'email'
      },
      {
        name: t('admin.teachers.label.password'),
        cell: (row) => {
          return <RenderRowTable keyRow={'password'} row={row} />
        },
        sortable: false,
        sortField: 'password'
      }
    ];

    if (location.state && location.state.link_type != undefined && location.state.link_type != 'local') {
      dataColumns.splice(4, 1)
      dataColumns.splice(5, 1)
    }

    return <Xtable
      hiddenFilter={true}
      columns={dataColumns}
      data={csvFilteringDatas}
      totalRows={csvDatas && csvDatas.length || 0}
      loading={teachers?.isLoading}
      subHeaderComponent={
        <ImportForm
          csvFileDefault={csvFile}
          tenantIdDefault={filter.tenant_id}
          handleCloseForm={() => {
            navigate('/admin/teacher-management')
          }}
          onImporCsvSuccess={() => onImporCsvSuccess()}
          onImporCsvChecked={(result) => {
            navigate('.', { state: { link_type: result.link_type, csv_file: result.csv_file, payload: result?.data?.data, tenant_id: result.tenant_id } })
          }}
          showConfirmButton={true}
        />
      }
      setFilter={setFilter}
    />
  }

  return (
    <div className="m-6 pb-5">
      {renderTable()}
    </div>
  );
}

export default LoadingHoc(TeacherManagement);
