import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, File, CheckCircle, AlertCircle } from 'lucide-react'
import { api, endpoints } from '../services/api'
import toast from 'react-hot-toast'

interface MediaFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
}

interface MediaUploadProps {
  onUploadComplete: (files: MediaFile[]) => void
  multiple?: boolean
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  className?: string
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onUploadComplete,
  multiple = true,
  accept = ['image/*', 'video/*', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<MediaFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      setUploading(true)
      const newFiles: MediaFile[] = []

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData()
          formData.append('file', file)

          // Update progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

          const response = await api.post(endpoints.media.upload, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
              }
            },
          })

          const uploadedFile = response.data.file
          newFiles.push(uploadedFile)
          setUploadedFiles(prev => [...prev, uploadedFile])

          // Complete progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        }

        onUploadComplete(newFiles)
        toast.success(`Successfully uploaded ${newFiles.length} file(s)`)
      } catch (error: any) {
        console.error('Upload error:', error)
        toast.error(error.response?.data?.message || 'Upload failed')
      } finally {
        setUploading(false)
        // Clear progress after a delay
        setTimeout(() => {
          setUploadProgress({})
        }, 2000)
      }
    },
    [onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple,
    accept: accept.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as { [key: string]: string[] }),
    maxSize,
    maxFiles,
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    onUploadComplete(uploadedFiles.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />
    if (mimeType.startsWith('video/')) return <File className="h-8 w-8 text-red-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType === 'application/pdf') return 'PDF'
    return 'Document'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer ${
          isDragActive
            ? 'border-naath-blue bg-blue-50'
            : isDragReject
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <Upload className={`mx-auto h-12 w-12 ${
            isDragActive ? 'text-naath-blue' : 'text-gray-400'
          }`} />
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive
                ? 'Drop files here'
                : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {multiple ? 'Multiple files allowed' : 'Single file only'} • Max size: {formatFileSize(maxSize)}
            </p>
            {accept.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Accepted types: {accept.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">{filename}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-naath-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-3 relative group">
                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-200"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* File Preview */}
                <div className="flex items-center space-x-3">
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.originalName}</p>
                    <p className="text-xs text-gray-500">{getFileType(file.mimeType)} • {formatFileSize(file.size)}</p>
                  </div>
                </div>

                {/* Success Indicator */}
                <div className="absolute top-2 left-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-naath-blue"></div>
          <span>Uploading files...</span>
        </div>
      )}
    </div>
  )
}

export default MediaUpload
