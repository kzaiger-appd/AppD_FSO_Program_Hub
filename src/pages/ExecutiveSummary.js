// import Box from '@mui/material/Box';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the styles
import React, { useState, useEffect, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Typography, Box } from '@mui/material';
import { API, graphqlOperation } from 'aws-amplify';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import { listTodos } from '../graphql/queries'; 
import styled from 'styled-components';
import { updateTodo } from '../graphql/mutations'; 
import "./ExecutiveSummary.css";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const modules1 = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}],
    ['bold', 'italic', 'underline'],
    [{ 'color': [] }],
    [{ 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' },]
  ],
  clipboard: {
    // toggle to add extra line breaks when pasting HTML:
    matchVisual: false,
  }
};

const textstyle={ fontFamily: 'Arial', fontSize: '15px' }

const EditorContainer = styled.div`
  .ql-toolbar {
    display: none;
  }

  .ql-container {
    font-size: 15px;
    font-family:'Arial'
}

  &.focused .ql-toolbar {
    display: block;
  }
  .ql-container {
    border-left: 0px;
    border-right: 0px;
    border-bottom: 0px;
  }

`;

function RichTextEditorCell({ value, onValueChange, id }) {
  const quillRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = async () => {
    setIsFocused(false);
    
    onValueChange((newValue) => {
      console.log('Before API Call - Value:', newValue); // Add this line
      return newValue;
    });

    console.log('Before API Call - Value:', value); // Add this line

    try {
      const response = await API.graphql(
        graphqlOperation(updateTodo, {
          input: {
            id: id,
            backlog: value,
            // Include other fields to update as needed
          },
        })
      );

  
      if (response.errors) {
        console.error('GraphQL Errors:', response.errors);
        // Handle GraphQL errors here and provide feedback to the user
      } else {
        toast.success('Update successful');
        console.log('Update successful');
        onValueChange(value); // Update parent state with the new value
      }
    } catch (error) {
      console.error('Error updating data:', error);
      // Handle other errors here and provide feedback to the user
    }
  };
  

  const handleToolbar = (event) => {
    const ToolbarElement = event.target.className;
    if (ToolbarElement==='ql-picker-label') {
      setIsFocused(true);
    }
  };

  return (
    <div onBlur={handleToolbar} style = {{
      width: 400
    }}>
    <EditorContainer  className={`rich-text-editor ${isFocused ? 'focused' : ''}`} onDoubleClick={handleFocus}>
      <ReactQuill
        readOnly={!isFocused}
        ref={quillRef}
        value={localValue} // Use localValue, not value
        onChange={(content) => {
          setLocalValue(content); // Update local state
          onValueChange(content); // Update parent state immediately
        }}
        modules={modules1}
        theme="snow"
        onBlur={handleBlur}
        onKeyDown={(event) => {
          event.stopPropagation();
        }}
      />
    </EditorContainer>
    </div>
  );
}

// export default RichTextEditorCell;

function formatPlatform(platform) {
  switch (platform) {
    case "on-prem":
      return "On Prem";
    case "fso_and_cnao":
      return "Fso and Cnao";
    case "appd_cloud":
      return "Appd Cloud";
    case "csaas":
      return "Csaas";
    default:
      return platform; // Return the original value if not found in the mapping
  }
}

function formatStatus(status) {
  switch (status) {
    case "missed":
      return "Missed";
    case "onTrack":
      return "On Track";
    case "delayed":
      return "Delayed";
    default:
      return status; // Return the original value if not found in the mapping
  }
}

function ExecutiveSummary() {
  const [todos, setTodos] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [onTrackCheck, setOnTrackCheck]=useState(true);
  const [delayedCheck, setDelayedCheck]=useState(true);
  const [missedCheck, setMissedCheck]=useState(true);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 50,
    page: 0,
  });
  
  const [statusCounts, setStatusCounts] = React.useState({
    'onTrack': 0,
    delayed: 0,
    missed: 0,
  });
  
  React.useEffect(() => {
    setStatusCounts(countStatus(todos));
  }, [todos]);
  
  const countStatus = (todos) => {
    const counts = {
      'onTrack': 0,
      delayed: 0,
      missed: 0,
    };
    for (const row of todos) {
      counts[row.status] += 1;
    }
    return counts;
  };

  const updateRowInParent = (updatedRow) => {
    // Create a new array of todos with the updated row
    const updatedTodos = todos.map((todo) =>
      todo.id === updatedRow.id ? updatedRow : todo
    );

    // Update the state with the new array of todos
    setTodos(updatedTodos);
  };

  const filterTodos = () => {
    let filtered = todos.filter((todo) => {
      if (
        (onTrackCheck && todo.status === 'onTrack') ||
        (delayedCheck && todo.status === 'delayed') ||
        (missedCheck && todo.status === 'missed')
      ) {
        return true;
      }
      return false;
    });
    setFilteredTodos(filtered);
  };

  useEffect(() => {
    const fetchData = async () =>  {
      try {
        const response = await API.graphql(
          graphqlOperation(listTodos, {
            nextToken: nextToken,
          })
        );

        // Check for GraphQL errors in the response
        if (response.errors) {
          console.error('GraphQL Errors:', response.errors);
          // Handle GraphQL errors here, e.g., show an error message to the user
          return;
        }

        const responseData = response.data.listTodos;
        const todoItems = responseData.items.map((todo) => ({
          id: todo.id,
          projectName: todo.projectName,
          programContent: todo.programContent,
          releaseContent: todo.releaseContent,
          status: todo.status,
          platform: todo.platform_type,
          ccoTarget: todo.ccoTarget,
          ccoActual: todo.ccoActual,
          backlog: todo.backlog,
          projectVersion: todo.projectVersion,
          // Add more fields as needed
        }));
        setTodos(todoItems);
        setNextToken(responseData.nextToken); // Update the nextToken
        filterTodos(); // Call filterTodos to update the filtered data

      } catch (error) {
        console.error('Error fetching data:', error);
        // Handle other errors here, e.g., show an error message to the user
      }
    }

    fetchData();
  }, [nextToken]);

  useEffect(() => {
    filterTodos(); // Call filterTodos to update the filtered data
  }, [onTrackCheck, delayedCheck, missedCheck, todos]);


  const handleOnTrackChange = () => {
    setOnTrackCheck(!onTrackCheck);
    filterTodos(); // Call filterTodos to update the filtered data
  };
  
  const handleDelayedChange = () => {
    setDelayedCheck(!delayedCheck);
    filterTodos(); // Call filterTodos to update the filtered data
  };
  
  const handleMissedChange = () => {
    setMissedCheck(!missedCheck);
    filterTodos(); // Call filterTodos to update the filtered data
  };

  const stripHtmlTags = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };



  

  const columns = [
    { field: 'projectName', headerName: <Typography style={textstyle}>Project Name</Typography>, headerClassName: 'super-app-theme--header',  width: 20, flex: 2.5, renderCell: (params) => (
      <div>
        <Typography style={textstyle}>{params.row.projectName || ''} - {params.row.projectVersion || ''}</Typography>
        <Typography style={textstyle} color="textSecondary">{stripHtmlTags(params.row.programContent) || ''}</Typography>
      </div>
    )},
    {
      field: 'status',
      headerClassName: 'super-app-theme--header',
      headerName: <Typography style={textstyle}>Status</Typography>,
      width: 10,
      flex: 1,
      editable: false,
      type: "singleSelect",
      renderCell: (params) => (
        <div
          style={{
            background:
              params.value === "onTrack" ? 'lightgreen' :
              params.value === "delayed" ? 'gold' :
              params.value === "missed" ? 'salmon' : 'red',
            borderRadius: '5px', fontSize: '15px', fontFamily: 'Arial'
          }}
        >
          {formatStatus(params.row.status)}
        </div>
      ),
    },
  {
    field: 'platform',
    headerName: <Typography style={textstyle}>Platform</Typography>,
    headerClassName: 'super-app-theme--header',
    width: 10,
    flex: 1,
    editable: false,
    type: "singleSelect",
    renderCell: (params) => (
      <div style={textstyle}>
        {formatPlatform(params.value)}
      </div>
    ),
  },
  {
    field: 'cco',
    headerAlign: 'left',
    headerName: <Typography style={textstyle}>Launch</Typography>,
    headerClassName: 'super-app-theme--header',
    width: 15,
    flex: 1,
    renderCell: (params) => (
      <div>
        <Typography style={textstyle}>GA Planned <Typography style={textstyle} color="textSecondary">{params.row.ccoTarget || ''}</Typography></Typography>
        <Typography style={textstyle}>GA Target <Typography style={textstyle} color="textSecondary">{params.row.ccoActual || ''}</Typography></Typography>
      </div>
    )},
  {
    field: 'executiveSummary',
    headerName: <Typography style={textstyle}>Executive Summary</Typography>,
    headerClassName: 'super-app-theme--header',
    sortable: false,
    editable: false,
    width: 15,
    flex: 2.5,
    renderCell: (params) => (
      <RichTextEditorCell
      style={textstyle}
        value={params.row.backlog || ''}
        onValueChange={(content) => {
          const updatedRow = { ...params.row, backlog: content };
          // Call a function to update the state of the parent component with the updated row
          updateRowInParent(updatedRow);
        }}
      
        id={params.row.id}
      />
    ),
  },
  ];

  return (
    
    <>
    <Box    display="flex"
            justifyContent="center"
            alignItems="center"
            >
    <Navbar expand="lg" className="bg-body-tertiary">
    <Container style={{ background: 'transparent' }}>
      <input
      type="checkbox"
      checked={onTrackCheck}
      onChange={handleOnTrackChange}
    />
      <Button onClick={() => handleOnTrackChange()} variant="success" style={{color:'black', background: 'lightgreen', marginRight: '60px',fontFamily: 'Arial', fontSize: '15px'  }}>On Track: {statusCounts['onTrack']}</Button>
      <input
      type="checkbox"
      checked={delayedCheck}
      onChange={handleDelayedChange}
    />
      <Button onClick={() => handleDelayedChange()} variant="warning" style={{ background: 'gold' ,  marginRight: '60px' ,fontFamily: 'Arial', fontSize: '15px' }}>Delayed: {statusCounts.delayed}</Button>
      <input
      type="checkbox"
      checked={missedCheck}
      onChange={handleMissedChange}
    />
      <Button onClick={() => handleMissedChange()} variant="danger" style={{ color: 'black', background:'salmon',fontFamily: 'Arial', fontSize: '15px'  }}>Missed: {statusCounts.missed}</Button>
        <Navbar.Brand href="#"></Navbar.Brand>
      </Container>
    </Navbar>  
    </Box>
      <Box sx={{ height: '100%', width: '96%', marginLeft: 8 }}>
        <DataGrid
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          rows={filteredTodos}
          getRowHeight={() => 'auto'}
          columns={columns}
          pageSizeOptions={[50]}
          disableRowSelectionOnClick
        />
      </Box>
      <ToastContainer />
    </>
  );
}

export default ExecutiveSummary;