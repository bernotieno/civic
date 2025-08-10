export interface Project {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  county: string;
  status: 'ongoing' | 'completed' | 'planned';
  budget: string;
  startDate: string;
  category: string;
}

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Homa Bay Water Infrastructure Upgrade',
    description: 'Modernizing water supply systems across Homa Bay County',
    fullDescription: 'A comprehensive project to upgrade water infrastructure in Homa Bay County, including installation of new pipelines, water treatment facilities, and smart metering systems. This project aims to improve water access for over 2 million residents.',
    county: 'Homa Bay',
    status: 'ongoing',
    budget: 'KSh 5.2B',
    startDate: '2024-01-15',
    category: 'Infrastructure'
  },
  {
    id: '2',
    name: 'Homa Bay Digital Hub Development',
    description: 'Creating a modern digital innovation center in Homa Bay',
    fullDescription: 'Development of a state-of-the-art digital hub in Homa Bay County, offering a range of digital services to foster innovation and technology entrepreneurship. The facility will include co-working spaces, training centers, and high-speed internet connectivity.',
    county: 'Homa Bay',
    status: 'planned',
    budget: 'KSh 1.8B',
    startDate: '2024-06-01',
    category: 'Technology'
  },
  {
    id: '3',
    name: 'Homa Bay Healthcare Expansion',
    description: 'Expanding healthcare facilities and services in Homa Bay County',
    fullDescription: 'A major healthcare expansion project including construction of new health centers, upgrading existing facilities, and training healthcare workers. The project will improve healthcare access for rural communities.',
    county: 'Homa Bay',
    status: 'ongoing',
    budget: 'KSh 3.1B',
    startDate: '2023-09-01',
    category: 'Healthcare'
  },
  {
    id: '4',
    name: 'Homa Bay Agricultural Modernization',
    description: 'Modernizing farming practices and infrastructure in Homa Bay County',
    fullDescription: 'Implementation of modern agricultural techniques, irrigation systems, and farmer training programs to boost agricultural productivity in Homa Bay County. Includes establishment of agricultural processing centers.',
    county: 'Homa Bay',
    status: 'completed',
    budget: 'KSh 2.5B',
    startDate: '2023-03-01',
    category: 'Agriculture'
  }
];