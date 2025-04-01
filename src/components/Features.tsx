import React from 'react';
import { 
  BarChart3, 
  Users, 
  MessageCircle,
  Cloud,
  Leaf,
  LineChart,
  BookOpen,
  Share2,
  Bell,
  Settings,
  Zap,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Features() {
  const navigate = useNavigate();
  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      title: "Community Forum",
      description: "Connect with farmers, share experiences, and get advice from agricultural experts.",
      details: [
        "Real-time discussions",
        "Image and video sharing",
        "Topic categorization",
        "Expert verification badges"
      ]
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      title: "Analytics Dashboard",
      description: "Track and analyze your farm's performance with comprehensive data visualization.",
      details: [
        "Yield tracking",
        "Cost analysis",
        "Weather impact assessment",
        "Market trend analysis"
      ]
    },
    {
      icon: <Cloud className="w-8 h-8 text-blue-500" />,
      title: "Weather Forecasting",
      description: "Access detailed weather predictions and agricultural forecasting tools.",
      details: [
        "7-day forecasts",
        "Precipitation tracking",
        "Temperature trends",
        "Frost warnings"
      ]
    },
    {
      icon: <Leaf className="w-8 h-8 text-blue-500" />,
      title: "Crop Management",
      description: "Tools for planning and managing your crop cycles effectively.",
      details: [
        "Planting calendars",
        "Crop rotation planning",
        "Pest management",
        "Fertilization schedules"
      ]
    },
    {
      icon: <LineChart className="w-8 h-8 text-blue-500" />,
      title: "Market Intelligence",
      description: "Stay updated with market prices and trends for agricultural products.",
      details: [
        "Real-time price updates",
        "Market demand analysis",
        "Export opportunities",
        "Price predictions"
      ]
    },
    {
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      title: "Knowledge Base",
      description: "Access comprehensive farming guides and educational resources.",
      details: [
        "Best practices",
        "Video tutorials",
        "Research papers",
        "Case studies"
      ]
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Expert Network",
      description: "Connect with agricultural specialists for personalized guidance.",
      details: [
        "Direct messaging",
        "Video consultations",
        "Expert directories",
        { text: "Scheduled sessions", link: "/consultation/book" }
      ]
    },
    {
      icon: <Share2 className="w-8 h-8 text-blue-500" />,
      title: "Resource Sharing",
      description: "Platform for sharing and trading farming resources and equipment.",
      details: [
        "Equipment sharing",
        "Seed exchange",
        "Labor pooling",
        "Transport sharing"
      ]
    },
    {
      icon: <Bell className="w-8 h-8 text-blue-500" />,
      title: "Smart Alerts",
      description: "Receive timely notifications about important farming events.",
      details: [
        "Weather alerts",
        "Market updates",
        "Pest warnings",
        "Community events"
      ]
    },
    {
      icon: <Settings className="w-8 h-8 text-blue-500" />,
      title: "Farm Management",
      description: "Tools for managing farm operations and resources efficiently.",
      details: [
        "Inventory tracking",
        "Staff management",
        "Equipment maintenance",
        "Cost tracking"
      ]
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-500" />,
      title: "Smart Automation",
      description: "Automate routine farming tasks and monitoring systems.",
      details: [
        "Irrigation control",
        "Climate monitoring",
        "Feeding systems",
        "Data collection"
      ]
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-500" />,
      title: "Risk Management",
      description: "Tools for identifying and managing farming risks.",
      details: [
        "Insurance options",
        "Risk assessment",
        "Compliance tracking",
        "Safety protocols"
      ]
    }
  ];

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Platform Features</h1>
          <p className="text-xl text-gray-600">Discover all the tools and features available to help you succeed</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-50 rounded-lg mr-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.details.map((detail, idx) => {
                  const detailText = typeof detail === 'object' ? detail.text : detail;
                  const detailClass = typeof detail === 'object' ? 'text-blue-600 hover:underline' : '';
                  
                  return (
                    <li 
                      key={idx} 
                      className={`flex items-center text-gray-600 ${detailClass}`}
                      onClick={() => {
                        if (typeof detail === 'object' && detail.link) {
                          navigate(detail.link);
                        }
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                      {detailText}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}