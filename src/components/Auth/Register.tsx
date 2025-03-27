import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, UserPlus, Github, Twitter, Linkedin, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type UserType = 'farmer' | 'student' | 'expert' | 'organization';

interface UserProfile {
  user_type: UserType;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  organization_name: string;
  organization_type: string;
  institution_name: string;
  field_of_study: string;
  expertise_area: string;
  custom_expertise_area: string;
  years_of_experience: string;
  qualification: string;
  farm_size: string;
  farming_type: string;
  custom_farming_type: string;
  github_url: string;
  twitter_url: string;
  linkedin_url: string;
  bio: string;
  registration_number?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<UserProfile>({
    user_type: 'farmer',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    organization_name: '',
    organization_type: '',
    institution_name: '',
    field_of_study: '',
    expertise_area: '',
    custom_expertise_area: '',
    years_of_experience: '',
    qualification: '',
    farm_size: '',
    farming_type: '',
    custom_farming_type: '',
    github_url: '',
    twitter_url: '',
    linkedin_url: '',
    bio: '',
    registration_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const { signUp } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    // Prepare the data, handling custom fields
    const finalExpertiseArea = formData.expertise_area === 'other' ? formData.custom_expertise_area : formData.expertise_area;
    const finalFarmingType = formData.farming_type === 'other' ? formData.custom_farming_type : formData.farming_type;

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        user_type: formData.user_type,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        organization_name: formData.organization_name,
        organization_type: formData.organization_type,
        institution_name: formData.institution_name,
        field_of_study: formData.field_of_study,
        expertise_area: finalExpertiseArea,
        years_of_experience: formData.years_of_experience,
        qualification: formData.qualification,
        farm_size: formData.farm_size,
        farming_type: finalFarmingType,
        github_url: formData.github_url,
        twitter_url: formData.twitter_url,
        linkedin_url: formData.linkedin_url,
        bio: formData.bio,
        registration_number: formData.registration_number
      };

      await signUp(userData);
      // Redirect directly to signin page instead of registration success page
      navigate('/signin');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Sprout className="w-12 h-12 text-[#3498db]" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/signin" className="font-medium text-[#3498db] hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-gray-700">
                I am a
              </label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
              >
                <option value="farmer">Farmer</option>
                <option value="student">Student</option>
                <option value="expert">Agricultural Expert</option>
                <option value="organization">Organization (NGO/Government)</option>
              </select>
            </div>

            {formData.user_type === 'organization' ? (
              <>
                <div>
                  <label htmlFor="organization_name" className="block text-sm font-medium text-gray-700">
                    Organization Name
                  </label>
                  <input
                    id="organization_name"
                    name="organization_name"
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="organization_type" className="block text-sm font-medium text-gray-700">
                    Organization Type
                  </label>
                  <select
                    id="organization_type"
                    name="organization_type"
                    value={formData.organization_type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="government">Government Body</option>
                    <option value="ngo">NGO</option>
                    <option value="research">Research Institution</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <input
                    id="registration_number"
                    name="registration_number"
                    type="text"
                    required
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
              />
            </div>

            {formData.user_type === 'student' && (
              <>
                <div>
                  <label htmlFor="institution_name" className="block text-sm font-medium text-gray-700">
                    Institution Name
                  </label>
                  <input
                    id="institution_name"
                    name="institution_name"
                    type="text"
                    required
                    value={formData.institution_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="field_of_study" className="block text-sm font-medium text-gray-700">
                    Field of Study
                  </label>
                  <input
                    id="field_of_study"
                    name="field_of_study"
                    type="text"
                    required
                    value={formData.field_of_study}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
              </>
            )}

            {formData.user_type === 'expert' && (
              <>
                <div>
                  <label htmlFor="expertise_area" className="block text-sm font-medium text-gray-700">
                    Area of Expertise
                  </label>
                  <select
                    id="expertise_area"
                    name="expertise_area"
                    value={formData.expertise_area}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  >
                    <option value="">Select area</option>
                    <option value="crop_science">Crop Science</option>
                    <option value="soil_science">Soil Science</option>
                    <option value="agricultural_engineering">Agricultural Engineering</option>
                    <option value="plant_pathology">Plant Pathology</option>
                    <option value="animal_science">Animal Science</option>
                    <option value="agricultural_economics">Agricultural Economics</option>
                    <option value="horticulture">Horticulture</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.expertise_area === 'other' && (
                    <input
                      type="text"
                      name="custom_expertise_area"
                      value={formData.custom_expertise_area}
                      onChange={handleChange}
                      placeholder="Specify your area of expertise"
                      className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                    />
                  )}
                </div>
                <div>
                  <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">
                    Highest Qualification
                  </label>
                  <input
                    id="qualification"
                    name="qualification"
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="years_of_experience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <input
                    id="years_of_experience"
                    name="years_of_experience"
                    type="number"
                    min="0"
                    required
                    value={formData.years_of_experience}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
              </>
            )}

            {formData.user_type === 'farmer' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="farm_size" className="block text-sm font-medium text-gray-700">
                    Farm Size (acres)
                  </label>
                  <input
                    id="farm_size"
                    name="farm_size"
                    type="text"
                    value={formData.farm_size}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="farming_type" className="block text-sm font-medium text-gray-700">
                    Farming Type
                  </label>
                  <select
                    id="farming_type"
                    name="farming_type"
                    value={formData.farming_type}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="organic">Organic</option>
                    <option value="conventional">Conventional</option>
                    <option value="mixed">Mixed</option>
                    <option value="hydroponics">Hydroponics</option>
                    <option value="aquaponics">Aquaponics</option>
                    <option value="other">Other</option>
                  </select>
                  {formData.farming_type === 'other' && (
                    <input
                      type="text"
                      name="custom_farming_type"
                      value={formData.custom_farming_type}
                      onChange={handleChange}
                      placeholder="Specify your farming type"
                      className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                    />
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Social Profiles</h4>
              
              <div className="flex items-center">
                <Github className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  id="github_url"
                  name="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="GitHub URL"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <Twitter className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  id="twitter_url"
                  name="twitter_url"
                  type="url"
                  value={formData.twitter_url}
                  onChange={handleChange}
                  placeholder="Twitter URL"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                />
              </div>

              <div className="flex items-center">
                <Linkedin className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  placeholder="LinkedIn URL"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#3498db] focus:border-[#3498db] sm:text-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3498db] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3498db] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}