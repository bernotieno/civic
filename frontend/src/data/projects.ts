export interface Project {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  county: string; // Now represents scope (National, Regional, etc.)
  status: 'ongoing' | 'completed' | 'planned';
  budget: string;
  startDate: string;
  category: string;
  image: string;
}

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'National Broadband Infrastructure Project',
    description: 'Expanding high-speed internet connectivity across all 47 counties',
    fullDescription: 'A comprehensive national project to upgrade internet infrastructure across Kenya, including installation of fiber optic cables, 5G towers, and digital service centers. This project aims to improve digital access for over 50 million Kenyans.',
    county: 'National',
    status: 'ongoing',
    budget: 'KSh 120B',
    startDate: '2024-01-15',
    category: 'Infrastructure'
  },
  {
    id: '2',
    name: 'National Digital Innovation Hubs',
    description: 'Creating modern digital innovation centers across Kenya',
    fullDescription: 'Development of state-of-the-art digital hubs in major towns across Kenya, offering digital services to foster innovation and technology entrepreneurship. The facilities will include co-working spaces, training centers, and high-speed internet connectivity.',
    county: 'National',
    status: 'planned',
    budget: 'KSh 45B',
    startDate: '2024-06-01',
    category: 'Technology'
  },
  {
    id: '3',
    name: 'Universal Healthcare Coverage Initiative',
    description: 'Implementing comprehensive healthcare coverage for all Kenyans',
    fullDescription: 'A major national healthcare initiative including construction of new hospitals, upgrading existing facilities, training healthcare workers, and implementing universal health insurance. The project will ensure healthcare access for all Kenyans.',
    county: 'National',
    status: 'ongoing',
    budget: 'KSh 200B',
    startDate: '2023-09-01',
    category: 'Healthcare'
  },
  {
    id: '4',
    name: 'National Food Security Program',
    description: 'Modernizing agriculture and ensuring food security nationwide',
    fullDescription: 'Implementation of modern agricultural techniques, irrigation systems, and farmer training programs to boost agricultural productivity nationwide. Includes establishment of agricultural processing centers and strategic food reserves.',
    county: 'National',
    status: 'completed',
    budget: 'KSh 80B',
    startDate: '2023-03-01',
    category: 'Agriculture'
  }
];