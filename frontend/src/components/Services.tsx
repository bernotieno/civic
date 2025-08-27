import React from "react";
import { useNavigate } from "react-router-dom";
import BillCard from "./BillCard";

const projects = [
  {
    title: "Education",
    image: "/education.jpeg",
    votes: "2000+",
    description: "Shape the future of learning at our schools",
    link: "#",
  },
  {
    title: "Healthcare",
    image: "/Healthcare.jpeg",
    votes: "3000+",
    description: "Improve access to affordable and quality healthcare",
    link: "#",
  },
  {
    title: "Infrastructure",
    image: "/infrastructure.jpeg",
    votes: "2000+",
    description: "Better roads and infrastructure for economic growth",
    link: "#",
  },
];

const BillsProjects: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800">
            Current Bills/Projects
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mt-2">
            Explore active bills in Kenya's Parliament. Read, understand, and
            contribute your voice to shape legislation that affects our nation.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 justify-center max-w-7xl mx-auto">
          {projects.map((p, idx) => (
            <BillCard key={idx} {...p} />
          ))}
        </div>

        {/* View More Projects Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/projects')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            View More Projects
          </button>
        </div>
      </div>
    </section>
  );
};

export default BillsProjects;
