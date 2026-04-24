import { useState } from 'react';

const CATEGORIES = ['Water', 'Roads', 'Electricity', 'Sanitation', 'Health', 'Other'];

export default function IntakeForm({ refreshMap }) {
  const [formData, setFormData] = useState({
    location: '',
    category: '',
    urgency: 5,
    description: '',
    peopleAffected: '',
    photo: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const submitData = new FormData();
      submitData.append('location', formData.location);
      submitData.append('category', formData.category);
      submitData.append('urgency', formData.urgency);
      submitData.append('description', formData.description);
      if (formData.peopleAffected) {
        submitData.append('people_affected', formData.peopleAffected);
      }
      if (formData.photo) {
        submitData.append('photo', formData.photo);
      }

      const response = await fetch('http://localhost:3000/api/needs', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setIsSuccess(true);
      if (refreshMap) refreshMap();
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8 w-full text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-700 mb-2">Report submitted!</h2>
        <p className="text-gray-600 mb-6">Your issue has been logged.</p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setFormData({
              location: '',
              category: '',
              urgency: 5,
              description: '',
              peopleAffected: '',
              photo: null,
            });
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8 w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="e.g. Lajpat Nagar, Block C"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
            required
          >
            <option value="" disabled>Select a category...</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Urgency */}
        <div>
          <div className="flex justify-between mb-2">
            <label htmlFor="urgency" className="block text-sm font-semibold text-gray-700">Urgency Level</label>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formData.urgency} / 10</span>
          </div>
          <input
            type="range"
            id="urgency"
            name="urgency"
            min="1"
            max="10"
            value={formData.urgency}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low Priority</span>
            <span>Critical Emergency</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y"
            placeholder="Describe the issue in detail..."
            required
          />
        </div>

        {/* People Affected */}
        <div>
          <label htmlFor="peopleAffected" className="block text-sm font-semibold text-gray-700 mb-2">Estimated People Affected</label>
          <input
            type="number"
            id="peopleAffected"
            name="peopleAffected"
            min="1"
            value={formData.peopleAffected}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="e.g. 50"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <span className="block text-sm font-semibold text-gray-700 mb-2">Photo Upload</span>
          <label 
            htmlFor="photo" 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden"
          >
            {formData.photo ? (
              <img 
                src={URL.createObjectURL(formData.photo)} 
                alt="Selected preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF</p>
              </div>
            )}
            <input 
              id="photo" 
              name="photo" 
              type="file" 
              className="hidden" 
              onChange={handleChange}
              accept="image/*"
            />
          </label>
          {formData.photo && (
            <p className="mt-2 text-sm text-green-600 truncate">
              Selected file: {formData.photo.name}
            </p>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-[0.98] ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
        >
          {isLoading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
