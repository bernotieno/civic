import React, { useState, useEffect } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  project_type: string;
  status: string;
  budget: string | null;
  start_date: string | null;
  end_date: string | null;
  image: string | null;
  county: string;
  created_by: string;
  created_at: string;
}

interface County {
  id: number;
  name: string;
  code: string;
}

const ProjectsManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'infrastructure',
    county_id: '',
    budget: '',
    start_date: '',
    end_date: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    project_type: 'infrastructure',
    budget: '',
    start_date: '',
    end_date: '',
  });
  const [editSelectedImage, setEditSelectedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => {
    try {
      fetchUserInfo();
      fetchProjects();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
        // Only fetch counties if user is regional/national
        if (data.user.official_level !== 'local') {
          fetchCounties();
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/admin/projects/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounties = async () => {
    try {
      console.log('Fetching counties from http://localhost:8000/api/locations/counties/');
      const response = await fetch('http://localhost:8000/api/locations/counties/');
      console.log('Counties response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Counties data received:', data);
        // API returns paginated results with 'results' array
        if (data.results && Array.isArray(data.results)) {
          setCounties(data.results);
        } else if (Array.isArray(data)) {
          setCounties(data);
        } else {
          console.error('Counties API returned non-array:', data);
          setCounties([]);
        }
      } else {
        console.error('Counties fetch failed:', response.status, response.statusText);
        setCounties([]);
      }
    } catch (error) {
      console.error('Error fetching counties:', error);
      setCounties([]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      
      // For local officials, don't send county_id (backend will use their county)
      const dataToSend = { ...formData };
      if (userInfo?.official_level === 'local') {
        delete dataToSend.county_id;
      }
      
      // Filter out empty date fields
      Object.entries(dataToSend).forEach(([key, value]) => {
        if (value !== '' || !['start_date', 'end_date'].includes(key)) {
          formDataToSend.append(key, value);
        }
      });
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await fetch('http://localhost:8000/api/admin/projects/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          project_type: 'infrastructure',
          county_id: '',
          budget: '',
          start_date: '',
          end_date: '',
        });
        setSelectedImage(null);
        setImagePreview(null);
        fetchProjects();
        alert('Project created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Project creation failed:', errorData);
        alert(`Failed to create project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project');
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/admin/projects/${projectId}/status/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchProjects();
        alert('Project status updated successfully!');
      } else {
        alert('Failed to update project status');
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Error updating project status');
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditFormData({
      title: project.title,
      description: project.description,
      project_type: project.project_type,
      budget: project.budget || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
    });
    setEditImagePreview(project.image ? `http://localhost:8000${project.image}` : null);
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== '' || !['start_date', 'end_date'].includes(key)) {
          formDataToSend.append(key, value);
        }
      });
      
      if (editSelectedImage) {
        formDataToSend.append('image', editSelectedImage);
      }

      const response = await fetch(`http://localhost:8000/api/admin/projects/${selectedProject.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchProjects();
        alert('Project updated successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to update project: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/admin/projects/${projectId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchProjects();
        alert('Project deleted successfully!');
      } else {
        alert('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      infrastructure: 'bg-blue-100 text-blue-800',
      healthcare: 'bg-red-100 text-red-800',
      education: 'bg-purple-100 text-purple-800',
      agriculture: 'bg-green-100 text-green-800',
      environment: 'bg-teal-100 text-teal-800',
      social: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchProjects();
              fetchCounties();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Project
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {project.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(project.project_type)}`}>
                      {project.project_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={project.status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(project.status)}`}
                    >
                      <option value="planning">Planning</option>
                      <option value="approved">Approved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.budget ? `KSh ${Number(project.budget).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedProject(project);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditProject(project)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleCreateProject}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.project_type}
                    onChange={(e) => setFormData({...formData, project_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="infrastructure">Infrastructure</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="environment">Environment</option>
                    <option value="social">Social Services</option>
                  </select>
                </div>

                {userInfo?.official_level !== 'local' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">County</label>
                    <select
                      required
                      value={formData.county_id}
                      onChange={(e) => setFormData({...formData, county_id: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select County ({counties.length} available)</option>
                      {Array.isArray(counties) && counties.map((county) => (
                        <option key={county.id} value={county.id}>
                          {county.name}
                        </option>
                      ))}
                    </select>
                    {counties.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">No counties loaded. Check console for errors.</p>
                    )}
                  </div>
                )}
                
                {userInfo?.official_level === 'local' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">County</label>
                    <div className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      {userInfo?.county_name || 'Your County'}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Project will be created in your county</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget (KSh)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Image</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="mb-4">
                          <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-md" />
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Project Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="text-sm text-gray-900">{selectedProject.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedProject.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedProject.project_type)}`}>
                    {selectedProject.project_type}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProject.status)}`}>
                    {selectedProject.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Budget</label>
                <p className="text-sm text-gray-900">
                  {selectedProject.budget ? `KSh ${Number(selectedProject.budget).toLocaleString()}` : 'Not specified'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">County</label>
                <p className="text-sm text-gray-900">{selectedProject.county}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created By</label>
                <p className="text-sm text-gray-900">{selectedProject.created_by}</p>
              </div>
              
              {selectedProject.image && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Image</label>
                  <img 
                    src={`http://localhost:8000${selectedProject.image}`} 
                    alt={selectedProject.title}
                    className="mt-2 max-w-full h-48 object-cover rounded-md"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="text-sm text-gray-900">{new Date(selectedProject.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleUpdateProject}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Project</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    required
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={editFormData.project_type}
                    onChange={(e) => setEditFormData({...editFormData, project_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="infrastructure">Infrastructure</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="environment">Environment</option>
                    <option value="social">Social Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget (KSh)</label>
                  <input
                    type="number"
                    value={editFormData.budget}
                    onChange={(e) => setEditFormData({...editFormData, budget: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Image</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {editImagePreview ? (
                        <div className="mb-4">
                          <img src={editImagePreview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-md" />
                        </div>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload new image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditSelectedImage(file);
                                const reader = new FileReader();
                                reader.onloadend = () => setEditImagePreview(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManagement;