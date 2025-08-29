import { Bill, BillSummary, ChatHistory, ChatMessage } from '../types';

// Placeholder API functions - replace with actual backend endpoints

export const fetchBill = async (id: string): Promise<Bill> => {
  const response = await fetch(`/api/bills/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bill');
  }
  return response.json();
};

export const fetchBillSummary = async (id: string): Promise<BillSummary> => {
  const response = await fetch(`/api/bills/${id}/summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch bill summary');
  }
  return response.json();
};

export const fetchChatHistory = async (id: string): Promise<ChatHistory> => {
  const response = await fetch(`/api/bills/${id}/chat-history`);
  if (!response.ok) {
    throw new Error('Failed to fetch chat history');
  }
  return response.json();
};

export const sendChatMessage = async (id: string, question: string): Promise<ChatMessage> => {
  const response = await fetch(`/api/bills/${id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }
  
  return response.json();
};