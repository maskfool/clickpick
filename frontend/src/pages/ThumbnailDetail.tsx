import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { thumbnailsAPI } from '../services/api'
import { Loader2, ArrowLeft, Heart, Eye, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface Thumbnail {
  id: string
  title: string
  category: string
  imageUrl: string
  status: string
  likes: number
  views: number
  createdAt: string
  user: {
    name: string
    email: string
  }
}

const ThumbnailDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        const res = await thumbnailsAPI.getById(id!)
        setThumbnail(res.data.data.thumbnail)
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to load thumbnail')
        navigate('/explore')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchThumbnail()
  }, [id, navigate])

  const handleLike = async () => {
    if (!id) return
    try {
      setLiking(true)
      await thumbnailsAPI.like(id)
      setThumbnail((prev) =>
        prev ? { ...prev, likes: prev.likes + 1 } : prev
      )
      toast.success('Liked!')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to like thumbnail')
    } finally {
      setLiking(false)
    }
  }

  const handleDownload = () => {
    if (thumbnail?.imageUrl) {
      const link = document.createElement('a')
      link.href = thumbnail.imageUrl
      link.download = `thumbnail-${thumbnail.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!thumbnail) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container-responsive py-8">
        {/* Back Link */}
        <Link
          to="/explore"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explore
        </Link>

        {/* Thumbnail Card */}
        <div className="card overflow-hidden">
          <img
            src={thumbnail.imageUrl}
            alt={thumbnail.title}
            className="w-full max-h-[500px] object-contain bg-gray-100 dark:bg-gray-800"
          />

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {thumbnail.title}
              </h1>
              <span
                className={`badge ${
                  thumbnail.status === 'completed'
                    ? 'badge-success'
                    : thumbnail.status === 'failed'
                    ? 'badge-error'
                    : 'badge-warning'
                }`}
              >
                {thumbnail.status}
              </span>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Category: <span className="font-medium">{thumbnail.category}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Uploaded by <span className="font-medium">{thumbnail.user?.name}</span>
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6 text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" /> {thumbnail.views}
              </span>
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-1" /> {thumbnail.likes}
              </span>
              <span className="text-xs">
                Created {new Date(thumbnail.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleLike}
                disabled={liking}
                className="btn btn-outline"
              >
                <Heart className="w-4 h-4 mr-2" />
                {liking ? 'Liking...' : 'Like'}
              </button>
              <button onClick={handleDownload} className="btn btn-primary">
                <Download className="w-4 h-4 mr-2" /> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThumbnailDetail