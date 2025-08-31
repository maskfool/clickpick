import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Image, ArrowLeft, Plus, Loader2, Clock } from 'lucide-react'
import { thumbnailsAPI } from '../services/api'
import toast from 'react-hot-toast'

interface Thumbnail {
  id: string
  title: string
  category: string
  imageUrl: string
  status: string
  createdAt: string
}

const MyThumbnails = () => {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        const res = await thumbnailsAPI.getMy()
        setThumbnails(res.data.data.thumbnails || [])
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to fetch thumbnails')
      } finally {
        setLoading(false)
      }
    }
    fetchThumbnails()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Thumbnails
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and organize your created thumbnails
              </p>
            </div>
            <Link to="/create" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : thumbnails.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Image className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Thumbnails Yet 🎨
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You haven’t created any thumbnails yet. Start by generating your first one!
            </p>
            <Link to="/create" className="btn btn-primary">
              Create Thumbnail
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thumbnails.map((t) => (
              <Link
                key={t.id}
                to={`/thumbnails/${t.id}`}
                className="card overflow-hidden hover-lift transition-transform"
              >
                <img
                  src={t.imageUrl}
                  alt={t.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {t.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`badge ${
                        t.status === 'completed'
                          ? 'badge-success'
                          : t.status === 'failed'
                          ? 'badge-error'
                          : 'badge-warning'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyThumbnails