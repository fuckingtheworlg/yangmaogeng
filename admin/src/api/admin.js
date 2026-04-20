import api from './index'

export const login = (data) => api.post('/admin/login', data)

export const getStats = () => api.get('/admin/stats')

// 船舶
export const getShips = (params) => api.get('/admin/ships', { params })
export const addShip = (data) => api.post('/admin/ships', data)
export const updateShip = (id, data) => api.put(`/admin/ships/${id}`, data)
export const deleteShip = (id) => api.delete(`/admin/ships/${id}`)
export const finalizeShip = (id, data) => api.post(`/admin/ships/${id}/finalize`, data)

// 用户
export const getUsers = (params) => api.get('/admin/users', { params })
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

// 委托
export const getCommissions = (params) => api.get('/admin/commissions', { params })
export const addCommission = (data) => api.post('/admin/commissions', data)
export const updateCommission = (id, data) => api.put(`/admin/commissions/${id}`, data)
export const importCommissionToShip = (id, data) => api.post(`/admin/commissions/${id}/import-ship`, data)

// 交易
export const getTransactions = (params) => api.get('/admin/transactions', { params })
export const addTransaction = (data) => api.post('/admin/transactions', data)
export const updateTransaction = (id, data) => api.put(`/admin/transactions/${id}`, data)
export const deleteTransaction = (id) => api.delete(`/admin/transactions/${id}`)
