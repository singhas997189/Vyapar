import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

export const getStocks = (params) => api.get('/stocks', { params }).then(r => r.data)
export const getSectors = () => api.get('/sectors').then(r => r.data)
export const getSectorOverview = (sector) => api.get(`/sector/${encodeURIComponent(sector)}/overview`).then(r => r.data)
export const getStock = (symbol) => api.get(`/stock/${symbol}`).then(r => r.data)
export const getFundamentals = (symbol) => api.get(`/stock/${symbol}/fundamentals`).then(r => r.data)
export const getIndicators = (symbol) => api.get(`/stock/${symbol}/indicators`).then(r => r.data)
export const getNews = (symbol) => api.get(`/stock/${symbol}/news`).then(r => r.data)
export const getSignal = (symbol) => api.get(`/stock/${symbol}/signal`).then(r => r.data)

export const getPortfolio = () => api.get('/portfolio').then(r => r.data)
export const addHolding = (payload) => api.post('/portfolio', payload).then(r => r.data)
export const updateHolding = (id, payload) => api.put(`/portfolio/${id}`, payload).then(r => r.data)
export const deleteHolding = (id) => api.delete(`/portfolio/${id}`).then(r => r.data)

export default api
