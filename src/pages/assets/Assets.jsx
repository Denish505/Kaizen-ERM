import { useState, useEffect } from 'react'
import { Package, Plus, Search, Wrench, Users, DollarSign, AlertCircle, Edit, Monitor, Code } from 'lucide-react'
import { assetsService } from '../../services/assets.service'
import { hrmService } from '../../services/hrm.service'
import { Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Assets() {
    const [activeTab, setActiveTab] = useState('hardware') // hardware, software
    const [assets, setAssets] = useState([])
    const [licenses, setLicenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [employees, setEmployees] = useState([])

    // Form data for Asset
    const [assetForm, setAssetForm] = useState({
        name: '', asset_id: '', category: '',
        purchase_date: '', purchase_price: '', warranty_expiry: '',
        status: 'available', assigned_to: ''
    })

    // Form data for License
    const [licenseForm, setLicenseForm] = useState({
        software_name: '', license_key: '', seats: 1,
        purchase_date: '', expiry_date: '', price: '',
        vendor: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [assetsRes, licensesRes, empRes] = await Promise.all([
                assetsService.getAssets(),
                assetsService.getSoftwareLicenses(),
                hrmService.getEmployees()
            ])
            setAssets(assetsRes.data)
            setLicenses(licensesRes.data)
            setEmployees(empRes.data)
        } catch (err) {
            console.error("Error fetching assets data:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddAsset = async (e) => {
        e.preventDefault()
        try {
            const payload = {
                ...assetForm,
                purchase_price: parseFloat(assetForm.purchase_price) || 0,
                assigned_to: assetForm.assigned_to || null
            }
            await assetsService.createAsset(payload)
            toast.success('Asset created successfully')
            setShowAddModal(false)
            fetchData()
        } catch (err) {
            toast.error("Failed to create asset")
        }
    }

    const handleAddLicense = async (e) => {
        e.preventDefault()
        try {
            const payload = {
                ...licenseForm,
                price: parseFloat(licenseForm.price) || 0,
                seats: parseInt(licenseForm.seats)
            }
            await assetsService.createSoftwareLicense(payload)
            toast.success('License created successfully')
            setShowAddModal(false)
            fetchData()
        } catch (err) {
            toast.error("Failed to create license")
        }
    }

    const filteredItems = activeTab === 'hardware'
        ? assets.filter(a => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : licenses.filter(l => l.name?.toLowerCase().includes(searchQuery.toLowerCase()))

    const formatCurrency = (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN')}`

    const stats = {
        totalHardware: assets.length,
        totalLicenses: licenses.length,
        totalValue: assets.reduce((sum, a) => sum + parseFloat(a.purchase_price || 0), 0) +
            licenses.reduce((sum, l) => sum + parseFloat(l.cost || 0), 0)
    }

    if (loading) return <div className="loading-state">Loading assets...</div>

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Assets & Licenses</h1>
                    <p className="page-subtitle">Manage hardware and software inventory</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className={`btn ${activeTab === 'hardware' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('hardware')}
                    >
                        <Monitor size={18} /> Hardware
                    </button>
                    <button
                        className={`btn ${activeTab === 'software' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('software')}
                    >
                        <Code size={18} /> Software
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Add {activeTab === 'hardware' ? 'Asset' : 'License'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-3 mb-8">
                <div className="stat-card">
                    <div className="stat-card-icon primary"><Package size={24} /></div>
                    <div className="stat-card-value">{activeTab === 'hardware' ? stats.totalHardware : stats.totalLicenses}</div>
                    <div className="stat-card-label">Total Items</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon warning"><DollarSign size={24} /></div>
                    <div className="stat-card-value">{formatCurrency(stats.totalValue)}</div>
                    <div className="stat-card-label">Total Investment</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon info"><Users size={24} /></div>
                    <div className="stat-card-value">{employees.length}</div>
                    <div className="stat-card-label">Total Users</div>
                </div>
            </div>

            {activeTab === 'hardware' ? (
                <div className="grid grid-3 gap-6">
                    {filteredItems.length === 0 && (
                        <div className="glass-card" style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                            <p style={{ fontWeight: 600 }}>No assets found</p>
                        </div>
                    )}
                    {filteredItems.map(asset => (
                        <div key={asset.id} className="card p-4">
                            <div className="flex justify-between items-start mb-3">
                                <span className="badge badge-primary text-xs">{asset.category_name || asset.category?.name || 'Asset'}</span>
                                <span className={`badge ${asset.status === 'assigned' ? 'badge-success' :
                                        asset.status === 'maintenance' ? 'badge-warning' :
                                            asset.status === 'disposed' ? 'badge-danger' : 'badge-info'
                                    } text-xs uppercase`}>
                                    {asset.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <h3 className="font-semibold text-lg">{asset.name}</h3>
                            <p className="font-mono text-xs text-gray-500 mb-4">{asset.asset_id}</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Assigned To:</span>
                                    <span className="font-medium text-right">{asset.assigned_to_name || asset.assigned_to_details?.full_name || 'Unassigned'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Purchase Price:</span>
                                    <span>{formatCurrency(asset.purchase_price)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Current Value:</span>
                                    <span>{formatCurrency(asset.current_value)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Warranty:</span>
                                    <span className={asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date() ? 'text-red-500' : ''}>
                                        {asset.warranty_expiry || '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-3 gap-6">
                    {filteredItems.length === 0 && (
                        <div className="glass-card" style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Code size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                            <p style={{ fontWeight: 600 }}>No software licenses found</p>
                        </div>
                    )}
                    {filteredItems.map(license => (
                        <div key={license.id} className="card p-4">
                            <div className="flex justify-between items-start mb-3">
                                <Code size={20} className="text-primary-600" />
                                <span className="badge badge-info text-xs">{license.seats} Seats</span>
                            </div>
                            <h3 className="font-semibold text-lg">{license.name}</h3>
                            <p className="text-xs text-gray-500 mb-4">{license.vendor}</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">License Key:</span>
                                    <span className="font-mono bg-gray-100 px-1 rounded">****{license.key?.slice(-4)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cost:</span>
                                    <span>{formatCurrency(license.cost)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Expiry:</span>
                                    <span className={license.expiry_date && new Date(license.expiry_date) < new Date() ? 'text-red-500' : ''}>
                                        {license.expiry_date || 'No Expiry'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subscription:</span>
                                    <span>{license.is_subscription ? '✅ Yes' : '❌ No'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Logic Simplification for brevity, assume similar structure */}
            {/* Modal Logic Simplification for brevity, assume similar structure */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Add ${activeTab === 'hardware' ? 'Asset' : 'License'}`}>
                <form onSubmit={activeTab === 'hardware' ? handleAddAsset : handleAddLicense}>
                    <div className="form-group">
                        {activeTab === 'hardware' ? (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input type="text" className="form-input" required value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Asset ID</label>
                                    <input type="text" className="form-input" required value={assetForm.asset_id} onChange={e => setAssetForm({ ...assetForm, asset_id: e.target.value })} />
                                </div>
                                <div className="grid grid-2" style={{ gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <input type="text" className="form-input" placeholder="e.g. Laptop" value={assetForm.category} onChange={e => setAssetForm({ ...assetForm, category: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-input form-select" value={assetForm.status} onChange={e => setAssetForm({ ...assetForm, status: e.target.value })}>
                                            <option value="available">Available</option>
                                            <option value="in_use">In Use</option>
                                            <option value="repair">Repair</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-2" style={{ gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Price</label>
                                        <input type="number" className="form-input" value={assetForm.purchase_price} onChange={e => setAssetForm({ ...assetForm, purchase_price: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Assigned To</label>
                                        <select className="form-input form-select" value={assetForm.assigned_to} onChange={e => setAssetForm({ ...assetForm, assigned_to: e.target.value })}>
                                            <option value="">Unassigned</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Software Name</label>
                                    <input type="text" className="form-input" required value={licenseForm.software_name} onChange={e => setLicenseForm({ ...licenseForm, software_name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">License Key</label>
                                    <input type="text" className="form-input" required value={licenseForm.license_key} onChange={e => setLicenseForm({ ...licenseForm, license_key: e.target.value })} />
                                </div>
                                <div className="grid grid-2" style={{ gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Seats</label>
                                        <input type="number" className="form-input" required value={licenseForm.seats} onChange={e => setLicenseForm({ ...licenseForm, seats: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Price</label>
                                        <input type="number" className="form-input" value={licenseForm.price} onChange={e => setLicenseForm({ ...licenseForm, price: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vendor</label>
                                    <input type="text" className="form-input" value={licenseForm.vendor} onChange={e => setLicenseForm({ ...licenseForm, vendor: e.target.value })} />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
