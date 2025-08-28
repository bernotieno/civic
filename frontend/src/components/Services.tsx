import React from "react";
import { useNavigate } from "react-router-dom";
import BillCard from "./BillCard";

const bills = [
  {
    title: "Education Reform Bill",
    image: "/education.jpeg",
    votes: "2000+",
    description: "Comprehensive reforms to improve Kenya's education system",
    link: "#",
  },
  {
    title: "Healthcare Access Bill",
    image: "/Healthcare.jpeg",
    votes: "3000+",
    description: "Legislation to improve healthcare access and affordability",
    link: "#",
  },
  {
    title: "Infrastructure Development Bill",
    image: "/infrastructure.jpeg",
    votes: "2000+",
    description: "Framework for sustainable infrastructure development",
    link: "#",
  },
];

const Bills: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Parliamentary Bills
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-2">
            Explore active bills in Kenya's Parliament. Read, understand, and
            contribute your voice to shape legislation that affects our nation.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 justify-center max-w-7xl mx-auto">
          {bills.map((bill, idx) => (
            <BillCard key={idx} {...bill} />
          ))}
        </div>

        {/* View More Bills Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/bills')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View All Bills
          </button>
        </div>
      </div>
    </section>
  );
};

export default Bills;
