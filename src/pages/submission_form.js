import {FormControl, OverlayTrigger, Tooltip} from 'react-bootstrap'
import React, {useState, useRef, useEffect} from 'react';
import "./submission_form.css";
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Box from '@mui/material/Box';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styled from 'styled-components'; 
import { API, graphqlOperation } from 'aws-amplify';
import { createTodo, updateTodo } from '../graphql/mutations.js';
import { onCreateTodo, onUpdateTodo } from '../graphql/subscriptions';
import { listTodos } from '../graphql/queries'; // Adjust the import path as needed
// import Tooltip from 'react-bootstrap/Tooltip';
//import {Text} from 'react-bootstrap/Text'

//import FormText from 'react-bootstrap/FormText'

import Select from 'react-select';

const modules = {
    toolbar: [
      [{ 'header': '1' }, { 'header': '2' }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ],
    clipboard: {
      matchVisual: false,
    },
  };
  
  const EditorContainer = styled.div`
  .ql-toolbar {
    display: none;
  }

  &.focused .ql-toolbar {
    display: block;
  }

  .ql-editor {
    border-top: 2px solid #ccc;
    padding-top: 5px;
    height: 50px; /* Set the desired height of the editor */
    max-height: 500px; /* Set a maximum height if needed */
    overflow-y: auto; /* Enable vertical scrollbar if content exceeds the height */
  }
`;

  
function RichTextEditorCell({ value, onValueChange, placeholder }) {
    const quillRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
  
    const handleFocus = () => {
      setIsFocused(true);
    };
  
    const handleBlur = () => {
      setIsFocused(false);
    };
  
    return (
      <EditorContainer className={`rich-text-editor ${isFocused ? 'focused' : ''}`}>
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={onValueChange}
          modules={modules}
          theme="snow"
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder} // Add placeholder prop here
        />
      </EditorContainer>
    );
  }
  


function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    let day = today.getDate();

    // Ensure month and day have two digits
    month = month < 10 ? `0${month}` : month;
    day = day < 10 ? `0${day}` : day;

    return `${year}-${month}-${day}`;
}


function SubmissionForm(){

    const [isArchived, setIsArchived] = useState(false);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const editorRef = useRef(null);
    const [editorHtml, setEditorHtml] = useState('');
    const [todos, setTodos] = useState([]);
    const [nextToken, setNextToken] = useState(null);
    const [filteredTodos, setFilteredTodos] = useState([]);
    const [onTrackCheck, setOnTrackCheck]=useState(true);
    const [delayedCheck, setDelayedCheck]=useState(true);
    const [missedCheck, setMissedCheck]=useState(true);
    const [programContent, setProgramContent] = useState('');

    useEffect(() => {
        if (editorRef.current && isEditorFocused) {
          // When the editor is focused, show the toolbar options
          editorRef.current.getEditor().getModule('toolbar').container.style.display = 'block';
        } else if (editorRef.current) {
          // When the editor loses focus, hide the toolbar options
          editorRef.current.getEditor().getModule('toolbar').container.style.display = 'none';
        }
      }, [isEditorFocused]);


  
    const filterTodos = () => {
      let filtered = todos.filter((todo) => {
        if (isArchived && todo.archived) {
            return false;
          }
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
      console.log(filtered)
    };
  
    useEffect(() => {
      const fetchData = async () =>  {
        try {
          const response = await API.graphql(
            graphqlOperation(listTodos, {
              // limit: paginationModel.pageSize,
              filter: {
                archived: { ne: true },
              },
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
          console.log(responseData)
          const todoItems = responseData.items.map((todo) => ({
            id: todo.id,
            projectName: todo.projectName,
            projectVersion: todo.projectVersion,
            programContent: todo.programContent,
            releaseType: todo.releaseType,
            status: todo.status,
            releaseStatus: todo.releaseStatus,
            platform_type: todo.platform_type,
            ccoTarget: todo.ccoTarget,
            ccoActual: todo.ccoActual,
            ccoCommit: todo.ccoCommit,
            icDate: todo.icDate,
            backlog: todo.backlog,
            csldUrl: todo.csldUrl,
            timsSitUrl: todo.timsSitUrl,
            

            // Add more fields as needed
          }));
          setTodos(todoItems);
          // setFilteredTodos(todoItems);
          setNextToken(responseData.nextToken); // Update the nextToken
          filterTodos(); // Call filterTodos to update the filtered data
  
        } catch (error) {
          console.error('Error fetching data:', error);
          // Handle other errors here, e.g., show an error message to the user
        }
      }
  
      fetchData();
    }, [nextToken]);
  
    // [paginationModel, nextToken]
  
    useEffect(() => {
        filterTodos(); // Call filterTodos to update the filtered data
      }, [onTrackCheck, delayedCheck, missedCheck, isArchived, todos]);




    const formRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState({
        projectName: false,
        projectVersion: false,
        ccoCommit: false,
        ccoTarget: false,
        ccoActual: false,
        icDate: false,
        platform_type: false,
        status: false,
        releaseStatus: false,
        programContent: false,
        releaseType: false,
        csldUrl: false,
        timsSitUrl: false,
    });
    


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let isValid = true;
    
        // Define an array of valid input field names
        const validFieldNames = ["projectName", "projectVersion", "ccoCommit", "ccoTarget", "ccoActual", "icDate", "platform_type", "status", "releaseType", "csldUrl", "timsSitUrl", "releaseStatus", "programContent"];
    
        // Perform validation based on the input field name
        if (validFieldNames.includes(name)) {
            isValid = value.trim() !== ''; 
        }
    
        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [name]: !isValid,
        }));
    };


    

    const submitForm = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);
        setEnableUpdate(false);
    
        // Validate fields before submitting
        const hasErrors = Object.values(validationErrors).some((error) => error);
    
        if (hasErrors) {
            console.log('Form has validation errors. Please check the fields.');
            return;
        }
    
        try {
            // Include programContent in the payload
            payload.programContent = programContent;
    
            if (selectedProject) {
                // Updating existing entry
                const updatedData = {
                    id: selectedProject.id,
                    // Include other fields you want to update
                    ...payload,
                };
    
                const response = await API.graphql(graphqlOperation(updateTodo, { input: updatedData }));
                console.log('Data updated in Cosmos DB:', response);
            } else {
                // Creating new entry
                const response = await API.graphql(graphqlOperation(createTodo, { input: payload }));
                console.log('Data stored in Cosmos DB:', response);
            }
    
            formRef.current.reset();
    
            // Reset the editor content
            setEditorHtml('');
            
            setProgramContent('');

            // Reset other state variables if necessary
            setSelectedProject(null);
            setSelectedStatus('');
            setSelectedPlatform('');
            setSelectedReleaseStatus('');
            setSelectedProgramType('');
    
            window.scrollTo(0, 0);
            setSuccessMessage('Form submitted successfully!');
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error storing data:', error);
        }
    };
    
    useEffect(() => {
        // Set editor toolbar visibility
        if (editorRef.current && isEditorFocused) {
          editorRef.current.getEditor().getModule('toolbar').container.style.display = 'block';
        } else if (editorRef.current) {
          editorRef.current.getEditor().getModule('toolbar').container.style.display = 'none';
        }
      }, [isEditorFocused]);

    const [selectedProject, setSelectedProject] = useState(null);
    const updateOptions = filteredTodos.map(todo => ({ value: todo, label: todo.projectName }));
    const [enableUpdate, setEnableUpdate] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState();
    const [selectedPlatform, setSelectedPlatform] = useState();
    const [selectedReleaseStatus, setSelectedReleaseStatus] = useState();
    const [selectedProgramType, setSelectedProgramType] = useState();
    const [showArchiveConfirmation, setShowArchiveConfirmation] = useState(false);
    const [confirmArchive, setConfirmArchive]=useState(false);
    const [showArchiveButton, setShowArchiveButton]=useState(false);


    useEffect(() => {
        // Update state based on selected project
        if (selectedProject) {
          setSelectedStatus(selectedProject.status);
          setSelectedPlatform(selectedProject.platform_type);
          setSelectedReleaseStatus(selectedProject.releaseStatus);
          setSelectedProgramType(selectedProject.releaseType);
          setProgramContent(selectedProject.programContent || '');
          setIsArchived(selectedProject.archived || false);
          setShowArchiveButton(true)
        }
      }, [selectedProject]);

      useEffect(() => {
        // Subscribe to onCreateTodo
        const subscriptionCreate = API.graphql(graphqlOperation(onCreateTodo)).subscribe({
          next: (eventData) => {
            const newTodo = eventData.value.data.onCreateTodo;
            setTodos((prevTodos) => [...prevTodos, newTodo]);
            filterTodos();
          },
          error: (error) => {
            console.error('Error subscribing to onCreateTodo:', error);
          },
        });
    
        // Subscribe to onUpdateTodo
        const subscriptionUpdate = API.graphql(graphqlOperation(onUpdateTodo)).subscribe({
          next: (eventData) => {
            const updatedTodo = eventData.value.data.onUpdateTodo;
            setTodos((prevTodos) => {
              // Replace the existing todo with the updated one
              const updatedTodos = prevTodos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo));
              return updatedTodos;
            });
            filterTodos();
          },
          error: (error) => {
            console.error('Error subscribing to onUpdateTodo:', error);
          },
        });
    
        return () => {
          // Unsubscribe when the component unmounts
          subscriptionCreate.unsubscribe();
          subscriptionUpdate.unsubscribe();
        };
      }, [todos]); // Add any dependencies you need here


    const handleArchive = async (projectId) => {
        try {
        const updatedData = {
            id: projectId,
            archived: true,
        };

        const response = await API.graphql(graphqlOperation(updateTodo, { input: updatedData }));
        console.log('Data archived in Cosmos DB:', response);

        // Update the local state to reflect the archived status
        setIsArchived(true);
            
        // Reset the editor content
        setEditorHtml('');
        
        setProgramContent('');

        // Reset other state variables if necessary
        setSelectedProject(null);
        setSelectedStatus('');
        setSelectedPlatform('');
        setSelectedReleaseStatus('');
        setSelectedProgramType('');
        setShowArchiveButton(false)
        } catch (error) {
        console.error('Error archiving data:', error);
        }
    };
    
      
    return (
        <Box sx={{ marginLeft: 8 }}>
            <div style={{width: '20%', marginLeft:'40px'}} hidden={enableUpdate}>
            <Button variant="primary" size="sm" onClick={() => setEnableUpdate(true)}>
            Update/Archive existing project
        </Button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{width: '45%', marginLeft:'40px'}} hidden={!enableUpdate}>
            <Select placeholder='Select project to update or archive' options={updateOptions} onChange={(selectedOption) => setSelectedProject(selectedOption.value)} ></Select>
            </div>
            <div style={{ marginLeft: '10px' }} hidden={!showArchiveButton}>
          <Button variant="danger" size="sm" onClick={() => setShowArchiveConfirmation(true)}>
            Archive Project
          </Button>
          {showArchiveConfirmation && (
            <div className="confirmation-dialog">
              <p>Are you sure you want to archive this project?</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowArchiveConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setShowArchiveConfirmation(false);
                  setConfirmArchive(true);
                  setEnableUpdate(false);
                  setSelectedProject();
                  setSelectedStatus(false);
                  setShowArchiveButton(false)
                  setTimeout(() => {
                    setConfirmArchive(false);
                  }, 3000);

                  // Call handleArchive function to perform the archive action
                  handleArchive(selectedProject.id);
                }}
              >
                Confirm Archive
              </Button>
            </div>
          )}
        </div>
        {confirmArchive && <div style={{ marginLeft: '40px', marginTop: '10px' }} className="alert alert-success">{'Project has been archived'}</div>}
      </div>

        <Form ref={formRef} onSubmit={submitForm}>
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        <Container> 
        {/* <h12 class= "mt-3 text-muted d-flex justify-content-end"> *Mandatory Fields </h12> */}
        <Row className="reduce-top-padding">
        <Col xs={12} md={6}>
        <Form.Group className='pb-2 fw-bold text-muted mt-4 align-items-left'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-projectName`}>
                                        Additional information about Project Name.
                                    </Tooltip>
                                }
                            >
                                <div className="d-flex align-items-center">
                                <Form.Label className="mr-2" style={{ whiteSpace: 'nowrap' }}>Project Name*</Form.Label>
                                    <FormControl
                                        type="text"
                                        name="projectName"
                                        placeholder="Enter project name"
                                        required
                                        onChange={handleInputChange}
                                        className={`form-control ${
                                            validationErrors.projectName ? 'is-invalid' : ''
                                        } form-control-sm`}
                                        defaultValue={selectedProject?.projectName}
                                        style={{ width: '87%', overflow: 'hidden' }}
                                    />
                                </div>
                            </OverlayTrigger>
                            {validationErrors.projectName && (
                                <div className="invalid-feedback">Project Name is required.</div>
                            )}
                        </Form.Group>
        </Col>
        <Col xs={12} md={6}>
        <Form.Group className='pb-2 fw-bold text-muted mt-4 align-items-left'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-projectVersion`}>
                                        Additional information about Project Version.
                                    </Tooltip>
                                }
                            >
                                <div className="d-flex align-items-center">
                                <Form.Label className="mr-2" style={{ whiteSpace: 'nowrap' }}>Project Version*</Form.Label>
                                    <FormControl
                                        type="text"
                                        name="projectVersion"
                                        placeholder="Enter project version"
                                        required
                                        onChange={handleInputChange}
                                        className={`form-control ${
                                            validationErrors.projectVersion ? 'is-invalid' : ''
                                        } form-control-sm`}
                                        defaultValue={selectedProject?.projectVersion}
                                        style={{ width: '86%', overflow: 'hidden' }}
                                    />
                                </div>
                            </OverlayTrigger>
                            {validationErrors.projectVersion && (
                                <div className="invalid-feedback">Project Version is required.</div>
                            )}
                        </Form.Group>
        </Col>
        </Row>
    
        <Row>
                    <Col>
                        <Form.Group className='pb-2 fw-bold text-muted mt-3 mb-3'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-ccoCommit`}>
                                        Enter the GA Commit date.
                                    </Tooltip>
                                }
                            >
                                <Form.Label className='d-flex'>GA Commit*</Form.Label>
                            </OverlayTrigger>
                            <FormControl
                                type="date"
                                name="ccoCommit"
                                min={selectedProject ? undefined : getCurrentDate()}
                                required
                                onChange={handleInputChange}
                                className={`form-control ${validationErrors.ccoCommit ? 'is-invalid' : ''} form-control-sm`}
                                defaultValue={selectedProject?.ccoCommit}
                            />
                            {validationErrors.ccoCommit && (
                                <div className="invalid-feedback">GA Commit is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className='pb-2 fw-bold text-muted mt-3 mb-3'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-ccoTarget`}>
                                        Enter the GA Target date.
                                    </Tooltip>
                                }
                            >
                                <Form.Label className='d-flex'>GA Target*</Form.Label>
                            </OverlayTrigger>
                            <FormControl
                                type="date"
                                name="ccoTarget"
                                min={selectedProject ? undefined : getCurrentDate()}
                                required
                                onChange={handleInputChange}
                                className={`form-control ${validationErrors.ccoTarget ? 'is-invalid' : ''} form-control-sm`}
                                defaultValue={selectedProject?.ccoTarget}
                            />
                            {validationErrors.ccoTarget && (
                                <div className="invalid-feedback">GA Target is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Group className='pb-2 fw-bold text-muted mt-3 mb-3'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-ccoActual`}>
                                        Enter the GA Actual date.
                                    </Tooltip>
                                }
                            >
                                <Form.Label className='d-flex'>GA Actual*</Form.Label>
                            </OverlayTrigger>
                            <FormControl
                                type="date"
                                name="ccoActual"
                                min={selectedProject ? undefined : getCurrentDate()}
                                required
                                onChange={handleInputChange}
                                className={`form-control ${validationErrors.ccoActual ? 'is-invalid' : ''} form-control-sm`}
                                defaultValue={selectedProject?.ccoActual}
                            />

                            {validationErrors.ccoActual && (
                                <div className="invalid-feedback">GA Actual is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className=' pl-4 pb-2 fw-bold text-muted mt-3 mb-3'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-icDate`}>
                                        Enter the IC Date.
                                    </Tooltip>
                                }
                            >
                                <Form.Label className='d-flex'>IC Date*</Form.Label>
                            </OverlayTrigger>
                            <FormControl
                                type="date"
                                name="icDate"
                                min={selectedProject ? undefined : getCurrentDate()}
                                required
                                onChange={handleInputChange}
                                className={`form-control ${validationErrors.icDate ? 'is-invalid' : ''} form-control-sm`}
                                defaultValue={selectedProject?.icDate}
                            />

                            {validationErrors.icDate && (
                                <div className="invalid-feedback">IC Date is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                </Row>

        <Row>
        <Col>
                        <Form.Group className='pl-4 pb-2 fw-bold text-muted mt-3 mb-2 mr-5'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-status`}>
                                        Select the Program Status.
                                    </Tooltip>
                                }
                            >
                                <Form.Label>Program Status*</Form.Label>
                            </OverlayTrigger>
                            <Form.Select
                                id='formSelect'
                                name="status"
                                required
                                onChange={(e) => {
                                    handleInputChange(e);
                                    setSelectedStatus(e.target.value); 
                                }}
                                value={selectedStatus}
                                className={`form-control ${
                                    validationErrors.status ? 'is-invalid' : ''
                                } form-control-sm`}
                            >
                                <option value="">-Select-</option>
                                <option value="onTrack">On Track</option>
                                <option value="delayed">Delayed</option>
                                <option value="missed">Missed</option>
                            </Form.Select>
                            {validationErrors.status && (
                                <div className="invalid-feedback">Program Status is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className='pl-4 pb-2 fw-bold text-muted mt-3 mb-2 mr-5'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-platformType`}>
                                        Select the Platform Type.
                                    </Tooltip>
                                }
                            >
                                <Form.Label>Platform Type*</Form.Label>
                            </OverlayTrigger>
                            <Form.Select
                                name="platform_type"
                                required
                                onChange={(e) => {
                                    handleInputChange(e);
                                    setSelectedPlatform(e.target.value); 
                                }}
                                className={`form-control ${
                                    validationErrors.platform_type ? 'is-invalid' : ''
                                } form-control-sm`}
                                value={selectedPlatform}
                            >
                                <option value="">-Select-</option>
                                <option value="csaas">CSaaS</option>
                                <option value="appd_cloud">Appd Cloud</option>
                                <option value="on-prem">On-Prem</option>
                                <option value="fso_and_cnao">FSO and CNAO</option>
                            </Form.Select>
                            {validationErrors.platform_type && (
                                <div className="invalid-feedback">Platform Type is required.</div>
                            )}
                        </Form.Group>
                    </Col>
        </Row>
        <Row>
                    <Col>
                        <Form.Group className='pl-4 pb-2 fw-bold text-muted mt-3 mb-2 mr-5'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-releaseStatus`}>
                                        Select the Program Phase.
                                    </Tooltip>
                                }
                            >
                                <Form.Label>Program Phase*</Form.Label>
                            </OverlayTrigger>
                            <Form.Select
                                name="releaseStatus"
                                required
                                onChange={(e) => {
                                    handleInputChange(e);
                                    setSelectedReleaseStatus(e.target.value); 
                                }}
                                className={`form-control ${
                                    validationErrors.releaseStatus ? 'is-invalid' : ''
                                } form-control-sm`}
                                value={selectedReleaseStatus}
                            >
                                <option value="">-Select-</option>
                                <option value="ic">IC</option>
                                <option value="fcs">FCS</option>
                                <option value="ga">GA</option>
                            </Form.Select>
                            {validationErrors.releaseStatus && (
                                <div className="invalid-feedback">Program Phase is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className='pl-4 pb-2 fw-bold text-muted mt-3 mb-2 mr-5'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-releaseType`}>
                                        Select the Program Type.
                                    </Tooltip>
                                }
                            >
                                <Form.Label>Program Type*</Form.Label>
                            </OverlayTrigger>
                            <Form.Select
                                size="sm"
                                name="releaseType"
                                required
                                onChange={(e) => {
                                    handleInputChange(e);
                                    setSelectedProgramType(e.target.value); 
                                }}
                                className={`form-control ${
                                    validationErrors.releaseType ? 'is-invalid' : ''
                                } form-control-sm`}
                                value={selectedProgramType}
                            >
                                <option value="">-Select-</option>
                                <option value="option1">Feature</option>
                                <option value="option2">Maintenance</option>
                            </Form.Select>
                            {validationErrors.releaseType && (
                                <div className="invalid-feedback">Program Type is required.</div>
                            )}
                        </Form.Group>
                    </Col>
                </Row>
        
        <Row>
                    <Col>
                        <Form.Group className='pb-2 fw-bold text-muted mt-3 align-items-left'>
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id={`tooltip-programContent`}>
                                        Enter program content details.
                                    </Tooltip>
                                }
                            >
                                <Form.Label>Program Content*</Form.Label>
                            </OverlayTrigger>
                            <RichTextEditorCell
                            value={programContent}
                            onValueChange={(value) => {
                                setEditorHtml(value);
                                setProgramContent(value);
                            }}
                            placeholder="Enter program content..."
                        />

                        </Form.Group> 
                    </Col>
                    <Col>
    <Form.Group className='pb-2 fw-bold text-muted mt-3 align-items-left'>
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip id={`tooltip-csldUrl`}>
                    Enter the CSDL URL.
                </Tooltip>
            }
        >
            <Form.Label>CSDL URL*</Form.Label>
        </OverlayTrigger>
        <FormControl
            size="sm"
            type="text"
            name="csldUrl"
            placeholder="Enter CSDL URL"
            className={`form-control ${
                validationErrors.csldUrl ? 'is-invalid' : ''
            } form-control-sm`}
            defaultValue={selectedProject?.csldUrl}
        />
        {validationErrors.csldUrl && (
            <div className="invalid-feedback">
                CSDL URL is required.
            </div>
        )}
        {/* <p className="text-left text-size text-danger"><small>* If CSDL is not applicable please mark it as N/A</small></p> */}
    </Form.Group>
</Col>

</Row>

<Row>
<Col xs={6}>
    <Form.Group className='pb-2 fw-bold text-muted mt-3 align-items-left'>
        <OverlayTrigger
            placement="top"
            overlay={
                <Tooltip id={`tooltip-timsSitUrl`}>
                    Enter the test URL.
                </Tooltip>
            }
        >
            <Form.Label>Test URL*</Form.Label>
        </OverlayTrigger>
        <FormControl
            size="sm"
            type="text"
            name="timsSitUrl"
            placeholder="Enter Test URL"
            className={`form-control ${
                validationErrors.timsSitUrl ? 'is-invalid' : ''
            } form-control-sm`}
            defaultValue={selectedProject?.timsSitUrl}
        />
        {validationErrors.timsSitUrl && (
            <div className="invalid-feedback">
                Test URL is required.
            </div>
        )}
    </Form.Group>
</Col>

    </Row>
    <Row className="mt-3">
    <Col className="d-flex justify-content-center">
    <Button variant="primary" type="submit" size="sm">
            Submit
        </Button>
    </Col>
</Row>

        </Container>
      </Form>
      </Box>
    )
}

export default SubmissionForm;
