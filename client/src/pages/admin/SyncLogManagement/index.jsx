import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import moment from 'moment'
import { useTranslation } from "react-i18next";
import Autocomplete from "../../../components/common/Autocomplete";

import { useGetTenantsQuery } from "../../../store/services/tenants";
import { useGetDataQuery } from "../../../store/services/request";
import LoadingHoc from "../../../hocs/LoadingHoc";
import { useAuth } from "../../../hooks/useAuth";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import { Xtable } from "../../../components/common/Forms";
import DatePicker from "../../../components/common/Datepicker";

const SyncLogManagement = ({ setLoading }) => {
  const { setTitle } = useOutletContext()
  const { t } = useTranslation()
  const auth = useAuth();
  // var dateStart = new Date().setDate(new Date().getDate() - 7);
  // var dateEnd = new Date();

  const [filterDate, setFilterDate] = useState({
    date_start: '',
    date_end: ''
    // date_start: new Date((moment(new Date()).subtract(6, 'days'))),
    // date_end: new Date()
  })

  const dateFormat = (inputDate, format) => {
    //parse the input date
    const date = new Date(inputDate);

    //extract the parts of the date
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    //replace the month
    format = format.replace("MM", month.toString().padStart(2, "0"));

    //replace the year
    if (format.indexOf("yyyy") > -1) {
      format = format.replace("yyyy", year.toString());
    } else if (format.indexOf("yy") > -1) {
      format = format.replace("yy", year.toString().substr(2, 2));
    }

    //replace the day
    format = format.replace("dd", day.toString().padStart(2, "0"));

    return format;
  }

  var format_date = 'yyyy-MM-dd';
  const [filter, setFilter] = useState({
    per_page: 10,
    page: 1,
    order: [],
    keyword: '',
    tenant_id: (auth.user.data.role == 'superadmin') ? '' : auth.user.data.tenant_id,
    school_id: (auth.user.data.role == 'school_admin') ? auth.user.data.school_id : '',
    date_start: '',
    date_end: '',
    // date_start: moment(new Date()).subtract(6, 'days').format('YYYY-MM-DD'),
    // date_end: moment(new Date()).format('YYYY-MM-DD'),
  })

  useEffect(() => {
    setTitle(t('admin.sync_logs.title'))
  }, []);

  const tenants = useGetTenantsQuery();

  const teachers = useGetDataQuery((filter.tenant_id) ? {
    endpoint: 'sync-logs',
    params: filter
  } : skipToken);

  const handleChangeDate = (field, val) => {
    setFilterDate((oldObject) => ({ ...oldObject, [field]: val }));
    var ds = dateFormat(val, format_date);
    setFilter((oldObject) => ({ ...oldObject, [field]: ds }))
  }

  const filterOption = useMemo(() => {
    return (
      <div className="flex flex-row justify-between items-end w-full">
        <div></div>
        <div className="flex flex-row space-x-2">
          {(auth.user.data.role == 'superadmin') &&
            <div className="w-60">
              <label className="block text-sm font-medium text-gray-700">{t('admin.sync_logs.label.tenant')}</label>
              <Autocomplete placeholder={t('placeholder.select_tenant')} data={tenants?.data?.data?.rows} defaultValue={false} value={filter.tenant_id}
                onChange={(obj) => {
                  if (obj?.id)
                    setFilter((oldObject) => ({ ...oldObject, tenant_id: obj.id }))
                }} />
            </div>
          }
          <div className="admin-filter-date">
            <label className="block text-sm font-medium text-gray-700">{t('admin.sync_logs.label.date_start')}</label>
            <DatePicker
              selected={filterDate.date_start}
              className={`
                  mt-1
                  border 
                  text-gray-700 
                  rounded 
                  py-2.5 px-2
                  focus:outline-none 
                  focus:bg-white 
                  focus:border-gray-500
                  block w-full
                  focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                `}
              dateFormat="yyyy/MM/dd"
              maxDate={filterDate.date_end || new Date()}
              placeholderText={t('placeholder.select_start_date')}
              onChange={(date) => {
                // if (date)
                if (filterDate.date_end) {
                  if (new Date((moment(date).add(6, 'days'))) < filterDate.date_end) {
                    handleChangeDate('date_end', new Date((moment(date).add(6, 'days'))))
                  }
                }
                handleChangeDate('date_start', date)
              }}
            />
          </div>
          <div className="admin-filter-date">
            <label className="block text-sm font-medium text-gray-700">{t('admin.sync_logs.label.date_end')}</label>
            <DatePicker
              selected={filterDate.date_end}
              className={`
                  mt-1
                  border 
                  text-gray-700 
                  rounded 
                  py-2.5 px-2
                  focus:outline-none 
                  focus:bg-white 
                  focus:border-gray-500
                  block w-full
                  focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                `}
              dateFormat="yyyy/MM/dd"
              placeholderText={t('placeholder.select_end_date')}
              minDate={filterDate.date_start}
              maxDate={new Date((moment(new Date()).subtract(6, 'days'))) <= filterDate.date_start ? new Date() : new Date((moment(filterDate.date_start).add(6, 'days')))}
              onChange={(date) => {
                // if (date)
                handleChangeDate('date_end', date)
              }}
            />
          </div>
        </div>
      </div>
    )
  }, [filterDate, tenants])


  const renderTable = () => {
    const totalRows = teachers?.data?.data?.count || 0
    const dataColumns = [
      {
        name: t('admin.sync_logs.label.no'),
        width: "5vw",
        center: true,
        cell: (row, index) => ((filter.page - 1) * filter.per_page) + (index + 1)
      },
      // {
      //   name: t('admin.sync_logs.label.type'),
      //   selector: row => row.type.toUpperCase(),
      //   sortable: true,
      //   sortField: 'type'
      // },
      {
        name: t('admin.sync_logs.label.status'),
        selector: row => row.status.toUpperCase(),
        sortable: true,
        sortField: 'status'
      },
      {
        name: t('admin.sync_logs.label.message'),
        selector: row => row.message.toUpperCase(),
        sortable: true,
        sortField: 'message'
      },
      {
        name: t('admin.sync_logs.label.content_data'),
        selector: row => row.content,
        width: "30vw",
        sortable: true,
        sortField: 'content'
      },
      {
        name: t('admin.sync_logs.label.created_date'),
        selector: row => moment(row.createdAt).format('YYYY/MM/DD hh:mm:ss'),
        center: true,
        sortable: true,
        sortField: 'createdAt',
        width: "15vw",
      },
    ];
    return <Xtable
      columns={dataColumns}
      data={teachers?.data?.data?.rows || []}
      totalRows={totalRows}
      loading={teachers?.isLoading}
      setFilter={setFilter}
      subHeaderComponent={filterOption}
    />
  }

  return (
    <div className="m-6">
      {renderTable()}
    </div>
  );
}

export default LoadingHoc(SyncLogManagement);
