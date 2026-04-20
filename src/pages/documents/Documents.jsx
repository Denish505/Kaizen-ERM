import { useState, useEffect } from 'react'
import { FileArchive, Plus, Search, Download, Folder, FileText, Image, File, Upload, Eye, Trash2, X, MoreVertical, Share2 } from 'lucide-react'
import { documentsService } from '../../services/documents.service'
import { format } from 'date-fns'
import { Modal, Button } from '../../components/ui'
import { toast } from 'react-hot-toast'

export default function Documents() {
    const [documents, setDocuments] = useState([])
    const [folders, setFolders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showFolderModal, setShowFolderModal] = useState(false)
    const [currentFolder, setCurrentFolder] = useState(null)
    const [fileToUpload, setFileToUpload] = useState(null)
    const [docTitle, setDocTitle] = useState('')
    const [newFolderName, setNewFolderName] = useState('')

    useEffect(() => {
        fetchData()
    }, [currentFolder])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = currentFolder ? { folder_id: currentFolder } : {}
            const [docsRes, foldersRes] = await Promise.all([
                documentsService.getDocuments(params),
                currentFolder ? { data: [] } : documentsService.getFolders() // Only show subfolders if backend supported hierarchy, for now flat + folders only at root or simple filtering
            ])
            setDocuments(docsRes.data)
            if (!currentFolder) setFolders(foldersRes.data)
        } catch (err) {
            console.error("Error fetching documents:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!fileToUpload) return
        try {
            await documentsService.createDocument({
                file: fileToUpload,
                title: docTitle.trim() || fileToUpload.name,
                folder: currentFolder || null
            })
            setShowUploadModal(false)
            setFileToUpload(null)
            setDocTitle('')
            fetchData()
            toast.success('File uploaded successfully')
        } catch (err) {
            console.error('Upload error:', err.response?.data || err)
            toast.error(err.response?.data?.file?.[0] || err.response?.data?.title?.[0] || 'Failed to upload file')
        }
    }

    const handleCreateFolder = async (e) => {
        e.preventDefault()
        try {
            await documentsService.createFolder({ name: newFolderName })
            setShowFolderModal(false)
            setNewFolderName('')
            fetchData()
            toast.success('Folder created successfully')
        } catch (err) {
            toast.error("Failed to create folder")
        }
    }

    const handleDelete = async (id, type) => {
        if (!window.confirm("Are you sure?")) return
        try {
            if (type === 'file') await documentsService.deleteDocument(id)
            else await documentsService.deleteFolder(id)
            fetchData()
            toast.success(`${type === 'file' ? 'File' : 'Folder'} deleted`)
        } catch (err) {
            toast.error("Failed to delete")
        }
    }

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) return <FileText size={24} className="text-red-500" />
        if (mimeType.includes('image')) return <Image size={24} className="text-purple-500" />
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileText size={24} className="text-green-500" />
        if (mimeType.includes('word') || mimeType.includes('document')) return <FileText size={24} className="text-blue-500" />
        return <File size={24} className="text-gray-400" />
    }

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    if (loading && !documents.length && !folders.length) return <div className="loading-state">Loading documents...</div>

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Documents</h1>
                    <p className="page-subtitle">Manage company files and assets</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={() => setShowFolderModal(true)}>
                        <Plus size={18} /> New Folder
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                        <Upload size={18} /> Upload File
                    </button>
                </div>
            </div>

            {/* Breadcrumb if inside folder */}
            {currentFolder && (
                <button
                    className="mb-4 text-sm text-primary-600 flex items-center gap-1 hover:underline"
                    onClick={() => setCurrentFolder(null)}
                >
                    &larr; Back to Root
                </button>
            )}

            {/* Folders (Only show at root for now for simplicity) */}
            {!currentFolder && folders.length > 0 && (
                <>
                    <h3 className="font-semibold mb-4 text-gray-700">Folders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md cursor-pointer transition-all text-center group relative"
                                onClick={() => setCurrentFolder(folder.id)}
                            >
                                <Folder size={40} className="text-yellow-400 mx-auto mb-2" />
                                <p className="font-medium truncate">{folder.name}</p>
                                <button
                                    className="absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder') }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Files */}
            <div className="card">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="card-title">Files</h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="form-input pl-9 py-1 text-sm w-64"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Uploaded By</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase())).map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50 group">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(doc.file_type || 'file')}
                                            <span className="font-medium text-gray-700">{doc.title}</span>
                                        </div>
                                    </td>
                                    <td className="text-gray-500 text-sm">{formatSize(doc.file_size || 0)}</td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[10px] text-primary-700 font-bold">
                                                U
                                            </div>
                                            <span className="text-sm">User</span>
                                        </div>
                                    </td>
                                    <td className="text-gray-500 text-sm">{new Date(doc.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={doc.file?.startsWith('http') ? doc.file : `http://127.0.0.1:8000${doc.file}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary text-primary-600">
                                                <Download size={14} />
                                            </a>
                                            <button
                                                className="btn btn-sm btn-secondary text-red-500 hover:bg-red-50"
                                                onClick={() => handleDelete(doc.id, 'file')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {documents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-gray-400">
                                        No files found in this folder
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Modal */}
            <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); setFileToUpload(null); setDocTitle('') }} title="Upload File">
                <form onSubmit={handleUpload}>
                    <div className="form-group">
                        <label className="form-label">Document Title <span className="text-gray-400 text-xs">(optional — defaults to filename)</span></label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={fileToUpload ? fileToUpload.name : 'e.g. Q1 Financial Report'}
                            value={docTitle}
                            onChange={(e) => setDocTitle(e.target.value)}
                        />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors relative mt-4">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setFileToUpload(e.target.files[0])}
                        />
                        <Upload size={40} className="text-gray-400 mx-auto mb-2" />
                        {fileToUpload ? (
                            <p className="text-primary-600 font-medium">{fileToUpload.name}</p>
                        ) : (
                            <>
                                <p className="font-medium text-gray-700">Click to browse</p>
                                <p className="text-xs text-gray-400 mt-1">Maximum size: 10MB</p>
                            </>
                        )}
                    </div>
                    {currentFolder && (
                        <p className="text-sm text-gray-500 mt-4 text-center">Uploading to currently selected folder</p>
                    )}
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => { setShowUploadModal(false); setFileToUpload(null); setDocTitle('') }}>Cancel</Button>
                        <Button type="submit" disabled={!fileToUpload}>Upload</Button>
                    </div>
                </form>
            </Modal>

            {/* New Folder Modal */}
            <Modal isOpen={showFolderModal} onClose={() => setShowFolderModal(false)} title="New Folder">
                <form onSubmit={handleCreateFolder}>
                    <div className="form-group">
                        <label className="form-label">Folder Name</label>
                        <input
                            type="text"
                            className="form-input"
                            autoFocus required
                            placeholder="e.g. Design Assets"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                    </div>
                    <div className="modal-footer" style={{ marginTop: '1.5rem', padding: 0, border: 'none', background: 'none' }}>
                        <Button variant="secondary" type="button" onClick={() => setShowFolderModal(false)}>Cancel</Button>
                        <Button type="submit">Create Folder</Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
