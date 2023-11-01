
import { useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { useTranslation } from 'react-i18next';
import { Bars } from 'react-loader-spinner'
import { useDispatch } from 'react-redux';


import './styles.scss';
const customStyles = {
	subHeader: {
		style: {
			display: 'flex',
			justifyContent: 'space-between',
			paddingLeft: 0,
			paddingRight: 0,
			marginBottom: '1rem',
			zIndex: 1
		},
	},
	table: {
		style: {
			borderCollapse: 'collapse',
		},
	},
	headCells: {
		draggingStyle: {
			cursor: 'move',
		},
	},
};


const Table = ({ data, columns, loading, totalRows, subHeaderComponent, setPage, setPerPage, setKeyword, setOrder }) => {
	const { t } = useTranslation();

	const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
	const [rows, setRows] = useState('');
	const [search, setSearch] = useState('');
	const [tableColumns, setTableColumns] = useState([]);
	const [cntChangeColumns, setChangeColumns] = useState(0);
	const [sortOrderDirection, setSortOrderDirection] = useState('asc')

	const handleChangePage = async (page, totalRows) => {
		setPage(page)
	}

	const handleChangePerPage = async (perPage, page) => {
		setPerPage(perPage)
		setPage(page)
	}

	const handleSort = async (column, sortDirection) => {
		setSortOrderDirection(sortDirection)
		if (column?.sortField)
			setOrder([column.sortField, sortDirection]);
		else
			setOrder([])
	};

	const subHeaderComponentMemo = useMemo(() => {
		const handleClear = () => {
			if (search) {
				setSearch('')
				setKeyword('')
				setResetPaginationToggle(!resetPaginationToggle);
			}
		};

		const handleSearch = () => {
			const regex1 = import.meta.env.VITE_BASE_URL.split('*')[0]
			const regex2 = import.meta.env.VITE_BASE_URL.split('*')[1]
			const filterSearch = search.replace(regex1, '').replace(regex2, '')
			setKeyword(filterSearch)
			setResetPaginationToggle(!resetPaginationToggle);
		}

		return (
			<>
				<div className='self-end flex flex-row items-end w-full align-middle'>
					{subHeaderComponent}
					<div className='flex flex-row items-end'>
						<input type="text"
							className="
								ml-2
								text-gray-700 
								border 
								border-gray-200 
								rounded 
								py-2 px-2
								focus:outline-none 
								focus:bg-white 
								focus:border-teal-500 focus:ring-teal-500
								self-center
							"
							placeholder={t('form.placeholder.search')}
							onChange={e => setSearch(e.target.value)}
							value={search}
							style={{ maxWidth: 215 }}
						/>
						<button
							className="
								bg-gradient-to-r from-teal-400 to-teal-600 shadow 
								hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
								ml-3 
								shadow 
								focus:shadow-outline 
								focus:outline-none 
								text-white font-bold self-center py-2 px-4 rounded
								min-w-max 
							"
							type="button" onClick={handleSearch}
						>{t('btn.btn_search')}</button>

						<button
							className="
								bg-gradient-to-r from-teal-400 to-teal-600 shadow 
								hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
								ml-3 
								shadow 
								focus:shadow-outline 
								focus:outline-none 
								text-white font-bold self-center py-2 px-4 rounded
								min-w-max 
							"
							type="button" onClick={handleClear}
						>{t('btn.btn_reset')}</button>
					</div>
				</div>
			</>
		);
	}, [search, resetPaginationToggle, subHeaderComponent]);

	useEffect(() => {
		let start = 1;
		const newData = data.map((row) => {
			return { ...row, no: ++start }
		})

		setRows(newData)

	}, [data])
	useEffect(() => {
		const newColumns = columns;

		newColumns.map(item => {
			item.reorder = false
			return item;
		});

		setTableColumns(newColumns)
	}, [columns]);

	const NoData = () => {
		return (
			<table className="w-full rdt_TableHeadRow">
				<thead className="">
					<tr className="text-white">
						{columns.map((item) => (
							<th className="py-4 text-center font-medium text-base" style={item?.width ? { width: item?.width } : null} key={item.name}>{item.name}</th>
						))}
					</tr>
				</thead>
				<tbody className="bg-white">
					<tr className="border border-gray-200">
						<td colSpan={columns.length}><h6 className='my-3 text-center text-black'>{t('table.no_data')}</h6></td>
					</tr>
				</tbody>
			</table>
		);
	}

	return (cntChangeColumns === 0 &&
		<DataTable
			noDataComponent={<NoData />}
			data={rows}
			columns={tableColumns}
			theme={'solarized'}
			customStyles={customStyles}
			onSort={handleSort}
			paginationTotalRows={totalRows}
			onChangePage={handleChangePage}
			onChangeRowsPerPage={handleChangePerPage}
			sortServer
			sortIcon={<font className='ml-1'>{sortOrderDirection === 'asc'? '▲' : '▼'}</font>}
			pagination
			paginationComponentOptions={{ rowsPerPageText: t('table.paging'), rangeSeparatorText: t('table.paging_sparator') }}
			paginationServer
			progressPending={loading}
			progressComponent={<Bars height="40" width="40" color="#06b57f" ariaLabel="bars-loading" wrapperStyle={{}} wrapperclassName="" visible={true} />}
			paginationResetDefaultPage={resetPaginationToggle} // optionally, a hook to reset pagination to page 1
			subHeader
			subHeaderComponent={subHeaderComponentMemo}
			onColumnOrderChange={(r) => {
				const newCntChangeColumn = cntChangeColumns + 1;
				setChangeColumns(newCntChangeColumn)
				setTimeout(() => {
					setChangeColumns(0)
				}, 1);
			}}
		/>
	)
}

export default Table
