'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { UserWithPlan, ServiceWithCategory, PlanWithServices, TransactionWithDetails } from '@/types'

export default function AdminPage() {
  const [user, setUser] = useState<UserWithPlan | null>(null)
  const [loading, setLoading] = useState(true)
   const [activeTab, setActiveTab] = useState<'service-groups' | 'categories' | 'services' | 'plans' | 'users' | 'transactions' | 'analytics'>('service-groups')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/signin')
      return
    }

    fetchUserData(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        if (!data.data.is_admin) {
          router.push('/dashboard')
          return
        }
        setUser(data.data)
      } else {
        localStorage.removeItem('token')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      localStorage.removeItem('token')
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }
    localStorage.removeItem('token')
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-800">Gecko Store - Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>

             {/* Tab Navigation */}
             <div className="flex flex-wrap gap-2 mb-6">
               <button
                 onClick={() => setActiveTab('service-groups')}
                 className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                   activeTab === 'service-groups'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 Service Groups
               </button>
               <button
                 onClick={() => setActiveTab('categories')}
                 className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                   activeTab === 'categories'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 Categories
               </button>
               <button
                 onClick={() => setActiveTab('services')}
                 className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                   activeTab === 'services'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 Services
               </button>
               <button
                 onClick={() => setActiveTab('plans')}
                 className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                   activeTab === 'plans'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 Plans
               </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  activeTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  activeTab === 'transactions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Analytics
              </button>
            </div>

             {/* Tab Content */}
             <div className="space-y-6">
               {activeTab === 'service-groups' && <ServiceGroupsTab />}
               {activeTab === 'categories' && <CategoriesTab />}
               {activeTab === 'services' && <ServicesTab />}
               {activeTab === 'plans' && <PlansTab />}
               {activeTab === 'users' && <UsersTab />}
               {activeTab === 'transactions' && <TransactionsTab />}
               {activeTab === 'analytics' && <AnalyticsTab />}
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ServiceGroupsTab() {
  const [serviceGroups, setServiceGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    fetchServiceGroups()
  }, [])

  const fetchServiceGroups = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/service-groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setServiceGroups(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch service groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/service-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        await fetchServiceGroups() // Refetch to get complete data with relations
        setShowCreateForm(false)
        resetForm()
        alert('Service group created successfully')
      } else {
        alert(data.error || 'Failed to create service group')
      }
    } catch (error) {
      console.error('Create service group error:', error)
      alert('Failed to create service group')
    }
  }

  const handleUpdate = async () => {
    if (!editingGroup) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/service-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        await fetchServiceGroups() // Refetch to get complete data with relations
        setEditingGroup(null)
        resetForm()
        alert('Service group updated successfully')
      } else {
        alert(data.error || 'Failed to update service group')
      }
    } catch (error) {
      console.error('Update service group error:', error)
      alert('Failed to update service group')
    }
  }

  const handleDelete = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this service group? This will also delete all categories and services in this group.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/service-groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setServiceGroups(serviceGroups.filter(g => g.id !== groupId))
        alert('Service group deleted successfully')
      } else {
        alert(data.error || 'Failed to delete service group')
      }
    } catch (error) {
      console.error('Delete service group error:', error)
      alert('Failed to delete service group')
    }
  }

  const startEdit = (group: any) => {
    setEditingGroup(group)
    setFormData({ name: group.name })
  }

  const resetForm = () => {
    setFormData({ name: '' })
  }

  const cancelEdit = () => {
    setEditingGroup(null)
    setShowCreateForm(false)
    resetForm()
  }

  if (loading) {
    return <div className="text-center py-8">Loading service groups...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Service Groups Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Add Group
        </button>
      </div>

      {(showCreateForm || editingGroup) && (
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 mb-6 border">
          <h4 className="text-lg font-semibold mb-4">
            {editingGroup ? 'Edit Service Group' : 'Create New Service Group'}
          </h4>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
              placeholder="e.g., Social Media Services"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingGroup ? handleUpdate : handleCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {editingGroup ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceGroups.map((group) => (
          <div key={group.id} className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{group.name}</h4>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(group)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{group._count.categories} categories</p>
            <p className="text-sm text-gray-600">Total services: {group.categories.reduce((sum: number, cat: any) => sum + cat._count.services, 0)}</p>
            <div className="mt-2 flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${
                group.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {group.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([])
  const [serviceGroups, setServiceGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_id: '',
    icon_url: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [categoriesRes, groupsRes] = await Promise.all([
        fetch('/api/admin/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/service-groups', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const [categoriesData, groupsData] = await Promise.all([
        categoriesRes.json(),
        groupsRes.json()
      ])

      if (categoriesData.success) setCategories(categoriesData.data)
      if (groupsData.success) setServiceGroups(groupsData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        await fetchData() // Refetch to get complete data with relations
        setShowCreateForm(false)
        resetForm()
        alert('Category created successfully')
      } else {
        alert(data.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Create category error:', error)
      alert('Failed to create category')
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        await fetchData() // Refetch to get complete data with relations
        setEditingCategory(null)
        resetForm()
        alert('Category updated successfully')
      } else {
        alert(data.error || 'Failed to update category')
      }
    } catch (error) {
      console.error('Update category error:', error)
      alert('Failed to update category')
    }
  }

  const handleDelete = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all services in this category.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setCategories(categories.filter(c => c.id !== categoryId))
        alert('Category deleted successfully')
      } else {
        alert(data.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Delete category error:', error)
      alert('Failed to delete category')
    }
  }

  const startEdit = (category: any) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      group_id: category.group_id.toString(),
      icon_url: category.icon_url || ''
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      group_id: '',
      icon_url: ''
    })
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setShowCreateForm(false)
    resetForm()
  }

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Service Categories Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Add Category
        </button>
      </div>

      {(showCreateForm || editingCategory) && (
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 mb-6 border">
          <h4 className="text-lg font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="e.g., Social Media"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Group</label>
              <select
                value={formData.group_id}
                onChange={(e) => setFormData({...formData, group_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
              >
                <option value="">Select Group</option>
                {serviceGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
              <input
                type="url"
                value={formData.icon_url}
                onChange={(e) => setFormData({...formData, icon_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="https://example.com/icon.png"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingCategory ? handleUpdate : handleCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-800">{category.name}</h4>
                <p className="text-sm text-gray-600">Group: {category.group.name}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(category)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            )}
            <p className="text-sm text-gray-600">{category._count.services} services</p>
            <div className="mt-2 flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${
                category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ServicesTab() {
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [serviceGroups, setServiceGroups] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithCategory | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    is_active: true,
    cookie_data: {} as Record<string, unknown>
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [servicesRes, groupsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/services', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/service-groups', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const [servicesData, groupsData, categoriesData] = await Promise.all([
        servicesRes.json(),
        groupsRes.json(),
        categoriesRes.json()
      ])

      if (servicesData.success) setServices(servicesData.data)
      if (groupsData.success) setServiceGroups(groupsData.data)
      if (categoriesData.success) setCategories(categoriesData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        await fetchData() // Refetch to get complete data with relations
        setShowCreateForm(false)
        resetForm()
        alert('Service created successfully')
      } else {
        alert(data.error || 'Failed to create service')
      }
    } catch (error) {
      console.error('Create service error:', error)
      alert('Failed to create service')
    }
  }

  const handleUpdate = async () => {
    if (!editingService) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        await fetchData() // Refetch to get complete data with relations
        setEditingService(null)
        resetForm()
        alert('Service updated successfully')
      } else {
        alert(data.error || 'Failed to update service')
      }
    } catch (error) {
      console.error('Update service error:', error)
      alert('Failed to update service')
    }
  }

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setServices(services.filter(s => s.id !== serviceId))
        alert('Service deleted successfully')
      } else {
        alert(data.error || 'Failed to delete service')
      }
    } catch (error) {
      console.error('Delete service error:', error)
      alert('Failed to delete service')
    }
  }

  const startEdit = (service: ServiceWithCategory) => {
    setEditingService(service)
    setFormData({
      code: service.code,
      name: service.name,
      category_id: service.category_id.toString(),
      is_active: service.is_active,
      cookie_data: service.cookie_data as Record<string, unknown>
    })
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category_id: '',
      is_active: true,
      cookie_data: {} as Record<string, unknown>
    })
  }

  const cancelEdit = () => {
    setEditingService(null)
    setShowCreateForm(false)
    resetForm()
  }

  if (loading) {
    return <div className="text-center py-8">Loading services...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Services Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Add Service
        </button>
      </div>

      {(showCreateForm || editingService) && (
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 mb-6 border">
          <h4 className="text-lg font-semibold mb-4">
            {editingService ? 'Edit Service' : 'Create New Service'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="e.g., facebook-basic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="e.g., Facebook Basic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.group.name} → {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.is_active.toString()}
                onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingService ? handleUpdate : handleCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {editingService ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800">{service.name}</h4>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(service)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Code: {service.code}</p>
            <p className="text-sm text-gray-600">Category: {service.category.name}</p>
            <p className="text-sm text-gray-600">Group: {service.category.group.name}</p>
            <div className="mt-2 flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${
                service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {service.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlansTab() {
  const [plans, setPlans] = useState<PlanWithServices[]>([])
  const [services, setServices] = useState<ServiceWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanWithServices | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_in_days: '',
    features: [] as string[],
    is_popular: false,
    is_active: true,
    serviceIds: [] as number[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [plansRes, servicesRes] = await Promise.all([
        fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/services', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      const [plansData, servicesData] = await Promise.all([
        plansRes.json(),
        servicesRes.json()
      ])

      if (plansData.success) setPlans(plansData.data)
      if (servicesData.success) setServices(servicesData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration_in_days: parseInt(formData.duration_in_days)
        })
      })

      const data = await response.json()
      if (data.success) {
        setPlans([...plans, data.data])
        setShowCreateForm(false)
        resetForm()
        alert('Plan created successfully')
      } else {
        alert(data.error || 'Failed to create plan')
      }
    } catch (error) {
      console.error('Create plan error:', error)
      alert('Failed to create plan')
    }
  }

  const handleUpdate = async () => {
    if (!editingPlan) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration_in_days: parseInt(formData.duration_in_days)
        })
      })

      const data = await response.json()
      if (data.success) {
        setPlans(plans.map(p => p.id === editingPlan.id ? data.data : p))
        setEditingPlan(null)
        resetForm()
        alert('Plan updated successfully')
      } else {
        alert(data.error || 'Failed to update plan')
      }
    } catch (error) {
      console.error('Update plan error:', error)
      alert('Failed to update plan')
    }
  }

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        setPlans(plans.filter(p => p.id !== planId))
        alert('Plan deleted successfully')
      } else {
        alert(data.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Delete plan error:', error)
      alert('Failed to delete plan')
    }
  }

  const startEdit = (plan: PlanWithServices) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration_in_days: plan.duration_in_days.toString(),
      features: Array.isArray(plan.features) ? plan.features as string[] : [],
      is_popular: plan.is_popular,
      is_active: plan.is_active,
      serviceIds: plan.plan_services.map(ps => ps.service.id)
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      duration_in_days: '',
      features: [],
      is_popular: false,
      is_active: true,
      serviceIds: []
    })
  }

  const cancelEdit = () => {
    setEditingPlan(null)
    setShowCreateForm(false)
    resetForm()
  }

  const toggleService = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }))
  }

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Plans Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Add Plan
        </button>
      </div>

      {(showCreateForm || editingPlan) && (
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 mb-6 border">
          <h4 className="text-lg font-semibold mb-4">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="e.g., Basic Plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rp)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="250000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input
                type="number"
                value={formData.duration_in_days}
                onChange={(e) => setFormData({...formData, duration_in_days: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.is_active.toString()}
                onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Popular</label>
              <input
                type="checkbox"
                checked={formData.is_popular}
                onChange={(e) => setFormData({...formData, is_popular: e.target.checked})}
                className="mr-2"
              />
              Mark as most popular plan
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Included Services</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white/30">
                {services.map((service) => (
                  <label key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{service.name} ({service.category.group.name})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingPlan ? handleUpdate : handleCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {editingPlan ? 'Update' : 'Create'}
            </button>
            <button
              onClick={cancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white/50 backdrop-blur-sm rounded-lg p-4 border-2 ${
            plan.is_popular ? 'border-blue-500' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                {plan.is_popular && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                    Most Popular
                  </div>
                )}
                <h4 className="font-semibold text-gray-800">{plan.name}</h4>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(plan)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">Rp {plan.price.toLocaleString()}</p>
            <p className="text-sm text-gray-600">{plan.duration_in_days} days</p>
            <p className="text-sm text-gray-600 mt-2">{plan.plan_services.length} services included</p>
            <div className="mt-2 flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${
                plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<UserWithPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBanUser = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(userId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ banned: !currentlyBanned })
      })

      const data = await response.json()
      if (data.success) {
        // Update user in state
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, banned: !currentlyBanned }
            : user
        ))
      } else {
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Failed to toggle ban:', error)
      alert('Failed to update user')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Users Management</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white/50 backdrop-blur-sm rounded-lg">
          <thead className="bg-white/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/20">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {user.plan?.name || 'No Plan'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.banned
                      ? 'bg-red-100 text-red-800'
                      : user.is_admin
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.banned ? 'Banned' : user.is_admin ? 'Admin' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!user.is_admin && (
                    <button
                      onClick={() => toggleBanUser(user.id, user.banned)}
                      disabled={actionLoading === user.id}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        user.banned
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === user.id ? '...' : user.banned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TransactionsTab() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTransactions()
  }, [statusFilter])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setTransactions(data.data.transactions)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Transactions ({total})</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white/50 backdrop-blur-sm rounded-lg">
          <thead className="bg-white/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-white/20">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {transaction.midtrans_order_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{transaction.user.name}</div>
                    <div className="text-sm text-gray-500">{transaction.user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.plan.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Rp {transaction.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    bannedUsers: number
    totalTransactions: number
    successfulTransactions: number
    totalRevenue: number
    monthlyRevenue: number
    activeSubscriptions: number
  }
  planDistribution: Array<{
    planName: string
    count: number
  }>
  recentTransactions: Array<{
    id: number
    orderId: string
    userName: string
    userEmail: string
    planName: string
    amount: number
    status: string
    createdAt: string
  }>
}

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  if (!analytics) {
    return <div className="text-center py-8">Failed to load analytics</div>
  }

  const { overview, planDistribution, recentTransactions } = analytics

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Analytics Dashboard</h3>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600">Total Users</h4>
          <p className="text-2xl font-bold text-gray-900">{overview.totalUsers}</p>
          <p className="text-xs text-gray-500">{overview.activeUsers} active, {overview.bannedUsers} banned</p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600">Active Subscriptions</h4>
          <p className="text-2xl font-bold text-green-600">{overview.activeSubscriptions}</p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600">Total Revenue</h4>
          <p className="text-2xl font-bold text-blue-600">Rp {overview.totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-600">Monthly Revenue</h4>
          <p className="text-2xl font-bold text-purple-600">Rp {overview.monthlyRevenue.toLocaleString()}</p>
        </div>
      </div>

       {/* Plan Distribution */}
       <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
         <h4 className="text-lg font-semibold text-gray-800 mb-4">Plan Distribution</h4>
         <div className="space-y-2">
           {planDistribution.map((plan, index) => (
             <div key={index} className="flex justify-between items-center">
               <span className="text-sm text-gray-700">{plan.planName}</span>
               <span className="text-sm font-medium text-gray-900">{plan.count} users</span>
             </div>
           ))}
         </div>
       </div>

       {/* Recent Transactions */}
       <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
         <h4 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h4>
         <div className="space-y-3">
           {recentTransactions.slice(0, 5).map((transaction) => (
             <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
               <div>
                 <p className="text-sm font-medium text-gray-900">{transaction.userName}</p>
                 <p className="text-xs text-gray-500">{transaction.planName} - {transaction.orderId}</p>
               </div>
               <div className="text-right">
                 <p className="text-sm font-medium text-gray-900">Rp {transaction.amount.toLocaleString()}</p>
                 <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
               </div>
             </div>
           ))}
         </div>
       </div>
    </div>
  )
}