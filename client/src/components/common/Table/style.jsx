export const TableStyle = {
  table: {
     style: {
       borderCollapse: 'collapse'
     },
   },
   subHeader: {
     style: {
       justifyContent: 'space-between',
       padding: '0px'
     }
   },
  head: {
     style: {
       fontSize: '0.875rem',
       fontWeight: 'bold',
     },
   },
   headRow: {
     style: {
       borderWidth: '1px 0px 1px 1px',
       borderColor: '#dee2e6',
       borderStyle: 'solid',
    minHeight: '2.5rem', // override the row height
     },
   },
   headCells: {
     style: {
    padding: '0.5rem 0.5rem',
    borderColor: '#dee2e6',
    borderWidth:'0px 1px 0px 0px',
    borderStyle : 'solid'
     },
     draggingStyle: {
       cursor: 'move',
     },
   },
  rows: {
      style: {
          minHeight: '2.5rem', // override the row height
          borderStyle: 'solid',
          borderColor: '#dee2e6',
          borderWidth: '0px 0px 1px 1px'
      },
  },
  cells: {
      style: {
       verticalAlign: 'top',
       padding: '0.5rem 0.5rem',
       borderColor: '#dee2e6',
       borderWidth:'0px 1px 0px 0px',
       borderStyle : 'solid'
      },
  },
 };
