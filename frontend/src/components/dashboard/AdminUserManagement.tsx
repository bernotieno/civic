import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  county: string;
  is_active: boolean;
  date_joined: string;
}

const AdminUserManagement: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    officials: 0,
    activeRate: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [counties, setCounties] = useState<any[]>([]);
  const [addFormData, setAddFormData] = useState({
    national_id: '',
    name: '',
    email: '',
    password: '',
    role: 'citizen',
    official_level: 'local',
    county_id: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchCounties();
  }, []);

  const fetchCounties = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/locations/counties/');
      if (response.ok) {
        const data = await response.json();
        setCounties(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching counties:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/admin/users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        
        // Calculate stats
        const total = data.data.length;
        const active = data.data.filter((u: User) => u.is_active).length;
        const officials = data.data.filter((u: User) => u.role === 'government_official').length;
        
        setStats({
          totalUsers: total,
          activeUsers: active,
          officials: officials,
          activeRate: total > 0 ? Math.round((active / total) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter(user => user.role === filter);

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'citizen': return 'bg-blue-100 text-blue-800';
      case 'local_official': return 'bg-purple-100 text-purple-800';
      case 'regional_official': return 'bg-orange-100 text-orange-800';
      case 'super_admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    // This would need a backend endpoint to activate/deactivate users
    console.log(`Toggle user ${userId} status from ${currentStatus}`);
    alert('User status toggle functionality needs backend implementation');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addFormData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setAddFormData({
          national_id: '',
          name: '',
          email: '',
          password: '',
          role: 'citizen',
          official_level: 'local',
          county_id: ''
        });
        fetchUsers();
        alert('User added successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to add user: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user');
    }
  };

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
        <h2 className="text-xl font-semibold text-gray-900">User Management ({users.length} users)</h2>
        <div className="flex space-x-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="government_official">Government Officials</option>
          </select>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">County</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.county}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.is_active ? 'active' : 'inactive')}`}>
                      {user.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(user.date_joined).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">View</button>
                      <button 
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`text-sm ${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">{stats.officials}</div>
          <div className="text-sm text-gray-600">Government Officials</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{stats.activeRate}%</div>
          <div className="text-sm text-gray-600">Active Rate</div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleAddUser}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">National ID</label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={addFormData.national_id}
                    onChange={(e) => setAddFormData({...addFormData, national_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="8-digit National ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({...addFormData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({...addFormData, role: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="government_official">Government Official</option>
                  </select>
                </div>

                {addFormData.role === 'government_official' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Official Level</label>
                    <select
                      value={addFormData.official_level}
                      onChange={(e) => setAddFormData({...addFormData, official_level: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="local">Local</option>
                      <option value="regional">Regional</option>
                      <option value="national">National</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">County</label>
                  <select
                    required
                    value={addFormData.county_id}
                    onChange={(e) => setAddFormData({...addFormData, county_id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select County</option>
                    {counties.map((county) => (
                      <option key={county.id} value={county.id}>
                        {county.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;