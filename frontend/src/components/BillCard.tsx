import React from "react";
import { ThumbsUp, ThumbsDown, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BillCardProps = {
  id: string;
  title: string;
  image: string;
  votes: string;
  description: string;
  link: string;
  status?: string;
};

const BillCard: React.FC<BillCardProps> = React.memo(({
  id,
  title,
  image,
  votes,
  description,
  link,
  status,
}) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
          {status || 'Active'}
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

      {/* Status + Analysis */}
      <div className="flex justify-between items-center px-4 mt-3 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{votes}</span>
        </div>
        <a
          href={link}
          className="text-blue-600 hover:underline font-medium flex items-center gap-1"
        >
          View Full Details →
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
        <div className="flex gap-2">
          <button className="bg-green-800 hover:bg-green-900 text-white text-sm px-3 py-2 rounded-md font-medium">
            Submit Feedback
          </button>
          <button 
            onClick={() => navigate(`/bills/${id}/details`)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-md font-medium"
          >
            Explore Bill
          </button>
        </div>
      </div>
    </div>
  );
});

export default BillCard;
