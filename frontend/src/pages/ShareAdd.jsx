import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Film, ArrowLeft } from 'lucide-react';
import { getCategories } from '../api/categories';
import { createReel } from '../api/reels';
import { useToast } from '../components/Toast';
import AddReelForm from '../components/AddReelForm';
import Loader from '../components/Loader';

export const ShareAdd = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract shared url and title from search params
  const sharedUrl = searchParams.get('url') || searchParams.get('text') || '';
  const sharedTitle = searchParams.get('title') || '';

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCats();
  }, []);

  const handleSaved = async (reelData) => {
    try {
      await createReel(reelData);
      addToast({ message: 'Shared reel saved successfully! 🚀' });
      navigate('/');
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return <Loader text="Loading your vault categories..." />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Vault</span>
      </button>

      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md mb-3">
          <Film className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Save Shared Video to ReelVault
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review the video details and pick a category
        </p>
      </div>

      <AddReelForm
        categories={categories}
        initialUrl={sharedUrl}
        onReelAdded={handleSaved}
      />
    </div>
  );
};

export default ShareAdd;
