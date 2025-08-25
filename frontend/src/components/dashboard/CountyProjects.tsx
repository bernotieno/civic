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
  document: string | null;
  county: string;
  created_by: string;
  created_at: string;
}

interface CountyProjectsProps {
  onProjectSelect: (project: Project) => void;
}

const CountyProjects: React.FC<CountyProjectsProps> = ({ onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCounty, setUserCounty] = useState<string>('');

  useEffect(() => {
    fetchUserInfo();
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
        setUserCounty(data.user.county_name);
        fetchProjects(data.user.county_name);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setLoading(false);
    }
  };

  const fetchProjects = async (countyName: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/public/projects/');
      if (response.ok) {
        const data = await response.json();
        // Filter projects by user's county
        const countyProjects = data.data.filter((project: Project) => 
          project.county === countyName
        );
        setProjects(countyProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{userCounty} County Projects</h2>
          <p className="text-gray-600">Explore ongoing and planned projects in your county</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{projects.length}</p>
          <p className="text-sm text-gray-500">Active Projects</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onProjectSelect(project)}
          >
            {/* Project Image */}
            {project.image && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={`http://localhost:8000${project.image}`} 
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(project.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
              
              <div className="mb-3">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {project.project_type}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {project.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget:</span>
                  <span className="font-medium text-gray-900">
                    {project.budget ? `KSh ${Number(project.budget).toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
                
                {project.start_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start Date:</span>
                    <span className="text-gray-900">{new Date(project.start_date).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
                
                {project.end_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">End Date:</span>
                    <span className="text-gray-900">{new Date(project.end_date).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>
              
              {/* Document Link */}
              {project.document && (
                <div className="mb-4">
                  <a 
                    href={`http://localhost:8000${project.document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📄 View Project Document
                  </a>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-500">Created by: {project.created_by}</span>
                <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountyProjects;