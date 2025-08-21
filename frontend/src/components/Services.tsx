import React from "react";
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
  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
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
        <div className="grid gap-6 md:grid-cols-3 justify-center">
          {projects.map((p, idx) => (
            <BillCard key={idx} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BillsProjects;
