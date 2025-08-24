import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProjects, Project } from '../data/projects';
import { Users, Search, Filter, ThumbsUp, ThumbsDown } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const ProjectList: React.FC = () => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const projectsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate API call to /public-updates
    const fetchProjects = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Duplicate projects to have more than 6 for demonstration
      const extendedProjects = [...mockProjects, ...mockProjects.map(p => ({...p, id: p.id + '_2'})), ...mockProjects.map(p => ({...p, id: p.id + '_3'}))];
      setAllProjects(extendedProjects);
      setFilteredProjects(extendedProjects);
      setDisplayedProjects(extendedProjects.slice(0, projectsPerPage));
      setLoading(false);
    };

    fetchProjects();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = allProjects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || project.status === statusFilter;
      const matchesCounty = !countyFilter || project.county === countyFilter;
      const matchesCategory = !categoryFilter || project.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCounty && matchesCategory;
    });
    
    setFilteredProjects(filtered);
    setDisplayedProjects(filtered.slice(0, projectsPerPage));
    setCurrentPage(1);
  }, [searchTerm, statusFilter, countyFilter, categoryFilter, allProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'planned': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const loadMoreProjects = () => {
    const nextPage = currentPage + 1;
    const startIndex = currentPage * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const newProjects = filteredProjects.slice(startIndex, endIndex);
    
    setDisplayedProjects(prev => [...prev, ...newProjects]);
    setCurrentPage(nextPage);
  };

  const hasMoreProjects = displayedProjects.length < filteredProjects.length;

  // Get unique values for filters
  const uniqueCounties = [...new Set(allProjects.map(p => p.county))];
  const uniqueCategories = [...new Set(allProjects.map(p => p.category))];
  const uniqueStatuses = [...new Set(allProjects.map(p => p.status))];

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCountyFilter('');
    setCategoryFilter('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">County Projects</h1>
          <p className="text-xl text-gray-600">Discover ongoing development projects across Kenya's counties</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Counties</option>
              {uniqueCounties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {displayedProjects.length} of {filteredProjects.length} projects
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 justify-center">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 pt-4">
                <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              {/* Image */}
              <div className="mt-2">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-36 object-cover rounded-md px-4"
                />
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm px-4 mt-2">{project.description}</p>

              {/* Budget + Analysis */}
              <div className="flex justify-between items-center px-4 mt-3 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{project.budget}</span>
                </div>
                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                >
                  View Full Analysis →
                </button>
              </div>

              {/* Actions */}
              <div className="px-4 py-4 flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100">
                    <ThumbsUp size={14} /> Support
                  </button>
                  <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100">
                    <ThumbsDown size={14} /> Oppose
                  </button>
                </div>
                <button 
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="bg-green-800 hover:bg-green-900 text-white text-sm px-4 py-2 rounded-md font-medium"
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMoreProjects && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreProjects}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Load More Projects
            </button>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProjectList;