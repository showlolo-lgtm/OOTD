import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInspirations, addInspiration, deleteInspiration } from '../api/inspirations';
import Modal from '../components/common/Modal';
import ImageUpload from '../components/common/ImageUpload';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function InspirationPage() {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourcePlatform, setSourcePlatform] = useState('');

  const { data: inspirations = [], isLoading } = useQuery({
    queryKey: ['inspirations'],
    queryFn: getInspirations,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append('file', file!);
      if (sourceUrl) formData.append('source_url', sourceUrl);
      if (sourcePlatform) formData.append('source_platform', sourcePlatform);
      return addInspiration(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
      setShowUpload(false);
      setFile(null);
      setSourceUrl('');
      setSourcePlatform('');
      toast.success('Inspiration saved!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInspiration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspirations'] });
      toast.success('Deleted');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Style Inspiration</h2>
          <p className="text-sm text-gray-400">{inspirations.length} saved looks</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : inspirations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">&#10024;</p>
          <p className="text-sm font-medium text-gray-600 mb-1">No inspirations yet</p>
          <p className="text-xs text-gray-400 mb-4">
            Save outfit photos from Instagram, Xiaohongshu, or anywhere
          </p>
          <button onClick={() => setShowUpload(true)} className="btn-primary text-sm py-2">
            Add First Inspiration
          </button>
        </div>
      ) : (
        /* Masonry-style grid */
        <div className="columns-2 gap-3 space-y-3">
          {inspirations.map((inspo) => (
            <div key={inspo.id} className="card break-inside-avoid">
              <img
                src={`/uploads/${inspo.image_path}`}
                alt="Inspiration"
                className="w-full object-cover"
              />
              <div className="p-3">
                {inspo.tags && inspo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {inspo.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="badge bg-primary-50 text-primary-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  {inspo.source_platform && (
                    <span className="text-xs text-gray-400 capitalize">
                      {inspo.source_platform}
                    </span>
                  )}
                  <div className="flex gap-1">
                    {inspo.source_url && (
                      <a
                        href={inspo.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(inspo.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="Add Inspiration"
      >
        <div className="space-y-4">
          <ImageUpload
            onImageSelect={setFile}
            label="Upload an outfit photo"
          />

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Source URL (optional)</label>
            <input
              type="url"
              placeholder="https://instagram.com/p/..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Platform</label>
            <div className="flex gap-2">
              {['Instagram', 'Xiaohongshu', 'Pinterest', 'Other'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSourcePlatform(p.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    sourcePlatform === p.toLowerCase()
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
            className="btn-primary w-full"
          >
            {uploadMutation.isPending ? 'Analyzing & Saving...' : 'Save Inspiration'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
