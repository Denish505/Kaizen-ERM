// src/data/mockData.js

export const employees = [
    { id: 1, name: "Alice Johnson", dept: "Engineering", role: "Senior Dev", status: "Active" },
    { id: 2, name: "Bob Smith", dept: "Marketing", role: "Lead", status: "On Leave" },
    { id: 3, name: "Charlie Davis", dept: "Design", role: "Designer", status: "Active" },
  ];
  
  export const projects = [
    { id: 101, title: "Kaizen ERP V1", client: "Internal", status: "In Progress", deadline: "2026-03-01", progress: 65 },
    { id: 102, title: "Website Redesign", client: "Acme Corp", status: "Planning", deadline: "2026-04-15", progress: 10 },
    { id: 103, title: "Mobile App Migration", client: "Globex", status: "Completed", deadline: "2025-12-20", progress: 100 },
  ];
  
  export const finances = [
    { id: 'INV-001', client: 'Acme Corp', amount: 4500.00, status: 'Paid', date: '2026-01-10' },
    { id: 'INV-002', client: 'Globex', amount: 12500.00, status: 'Pending', date: '2026-01-15' },
  ];
  
  export const assets = [
    { id: 'AST-001', name: 'MacBook Pro M3', assignedTo: 'Alice Johnson', condition: 'New' },
    { id: 'AST-002', name: 'Dell XPS 15', assignedTo: 'Charlie Davis', condition: 'Good' },
  ];