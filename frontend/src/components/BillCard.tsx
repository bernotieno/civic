import React from "react";
import { ThumbsUp, ThumbsDown, Users } from "lucide-react";

type BillCardProps = {
  title: string;
  image: string;
  votes: string;
  description: string;
  link: string;
};

const BillCard: React.FC<BillCardProps> = React.memo(({
  title,
  image,
  votes,
  description,
  link,
}) => {
  return (
    <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
          Active
        </span>
      </div>

      {/* Image */}
      <div className="mt-2">
        <img
          src={image}
          alt={title}
          className="w-full h-36 object-cover rounded-md px-4"
        />
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm px-4 mt-2">{description}</p>

      {/* Votes + Analysis */}
      <div className="flex justify-between items-center px-4 mt-3 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{votes} Votes</span>
        </div>
        <a
          href={link}
          className="text-blue-600 hover:underline font-medium flex items-center gap-1"
        >
          View Full Analysis →
        </a>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 flex justify-between items-center gap-2">
        <div className="flex gap-2">
          <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100">
            <ThumbsUp size={14} /> Agree
          </button>
          <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100">
            <ThumbsDown size={14} /> Disagree
          </button>
        </div>
        <button className="bg-green-800 hover:bg-green-900 text-white text-sm px-4 py-2 rounded-md font-medium">
          Submit Feedback
        </button>
      </div>
    </div>
  );
});

export default BillCard;
