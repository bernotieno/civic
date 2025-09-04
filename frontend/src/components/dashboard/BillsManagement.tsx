import React, { useState, useEffect } from 'react';

interface Bill {
  id: string;
  title: string;
  description: string;
  sponsor: string;
  status: string;
  status_display: string;
  participation_deadline?: string;
  document?: string;
  summary?: string;
  created_at: string;
}

const BillsManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sponsor: '',
    status: 'draft',
    participation_deadline: '',
  });
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/admin/bills/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBills(data.data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (billId: string, newStatus: string) => {
    console.log('Updating bill status:', { billId, newStatus });
    
    // Optimistic update
    setBills(prev => prev.map(bill => 
      bill.id === billId ? { ...bill, status: newStatus } : bill
    ));

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/admin/bills/${billId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const responseData = await response.json();
      console.log('Status update response:', responseData);

      if (!response.ok) {
        console.error('Failed to update status:', responseData);
        fetchBills();
        alert(`Failed to update bill status: ${responseData.error || 'Unknown error'}`);
      } else {
        console.log('Status updated successfully');
      }
    } catch (error) {
      console.error('Error updating bill status:', error);
      fetchBills();
      alert('Error updating bill status');
    }
  };

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowViewModal(true);
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setFormData({
      title: bill.title,
      description: bill.description,
      sponsor: bill.sponsor,
      status: bill.status,
      participation_deadline: bill.participation_deadline || '',
    });
    setShowEditForm(true);
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/admin/bills/${billId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchBills();
        alert('Bill deleted successfully!');
      } else {
        alert('Failed to delete bill');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Error deleting bill');
    }
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value);
        }
      });
      
      if (selectedDocument) {
        formDataToSend.append('document', selectedDocument);
      }

      const response = await fetch(`http://127.0.0.1:8000/api/admin/bills/${selectedBill.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        setShowEditForm(false);
        setSelectedBill(null);
        setFormData({
          title: '',
          description: '',
          sponsor: '',
          status: 'draft',
          participation_deadline: '',
        });
        setSelectedDocument(null);
        fetchBills();
        alert('Bill updated successfully!');
      } else {
        alert('Failed to update bill');
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Error updating bill');
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          formDataToSend.append(key, value);
        }
      });
      
      if (selectedDocument) {
        formDataToSend.append('document', selectedDocument);
      }

      const response = await fetch('http://127.0.0.1:8000/api/admin/bills/', {
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
          sponsor: '',
          status: 'draft',
          participation_deadline: '',
        });
        setSelectedDocument(null);
        fetchBills();
        alert('Bill created successfully!');
      } else {
        const errorText = await response.text();
        alert(`Failed to create bill: ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Error creating bill');
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
        <h2 className="text-2xl font-bold text-gray-900">Bills Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Bill
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sponsor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{bill.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{bill.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.sponsor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={bill.status}
                      onChange={(e) => handleStatusUpdate(bill.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="draft">Draft</option>
                      <option value="first_reading">First Reading</option>
                      <option value="committee_stage">Committee Stage</option>
                      <option value="second_reading">Second Reading</option>
                      <option value="third_reading">Third Reading</option>
                      <option value="presidential_assent">Presidential Assent</option>
                      <option value="enacted">Enacted</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.participation_deadline ? new Date(bill.participation_deadline).toLocaleDateString() : 'No deadline'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewBill(bill)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEditBill(bill)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteBill(bill.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Bill Modal */}
      {showViewModal && selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bill Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{selectedBill.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedBill.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sponsor</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBill.sponsor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBill.status_display}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Participation Deadline</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedBill.participation_deadline ? new Date(selectedBill.participation_deadline).toLocaleDateString() : 'No deadline set'}
                </p>
              </div>
              
              {selectedBill.document && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document</label>
                  <a 
                    href={selectedBill.document} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:text-blue-800"
                  >
                    View Document
                  </a>
                </div>
              )}
              
              {selectedBill.summary && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Summary</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedBill.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {showEditForm && selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <form onSubmit={handleUpdateBill}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Bill</h3>
              
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
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sponsor</label>
                  <input
                    type="text"
                    required
                    value={formData.sponsor}
                    onChange={(e) => setFormData({...formData, sponsor: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="first_reading">First Reading</option>
                    <option value="committee_stage">Committee Stage</option>
                    <option value="second_reading">Second Reading</option>
                    <option value="third_reading">Third Reading</option>
                    <option value="presidential_assent">Presidential Assent</option>
                    <option value="enacted">Enacted</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bill Document</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedDocument(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Participation Deadline</label>
                  <input
                    type="date"
                    value={formData.participation_deadline}
                    onChange={(e) => setFormData({...formData, participation_deadline: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Bill Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <form onSubmit={handleCreateBill}>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Bill</h3>
              
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
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sponsor</label>
                  <input
                    type="text"
                    required
                    value={formData.sponsor}
                    onChange={(e) => setFormData({...formData, sponsor: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="first_reading">First Reading</option>
                    <option value="committee_stage">Committee Stage</option>
                    <option value="second_reading">Second Reading</option>
                    <option value="third_reading">Third Reading</option>
                    <option value="presidential_assent">Presidential Assent</option>
                    <option value="enacted">Enacted</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bill Document</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedDocument(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Participation Deadline</label>
                  <input
                    type="date"
                    value={formData.participation_deadline}
                    onChange={(e) => setFormData({...formData, participation_deadline: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
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
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsManagement;