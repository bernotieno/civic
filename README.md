🇰🇪 CivicAI - Kenya's National Assembly Engagement Platform

Empowering 47 million voices to engage with Parliament. One secure, scalable platform.

🎯 Mission Statement
Transform civic engagement in Kenya by providing a secure, anonymous, and scalable platform where citizens can engage with National Assembly bills and projects while maintaining complete privacy and ensuring parliamentary accountability.
The Problem We're Solving

🚫 No Direct Channel: Citizens lack direct engagement with National Assembly bills and projects
🔒 Fear of Retaliation: People afraid to speak up about national legislation
📊 No Data Insights: Parliament lacks citizen feedback on proposed legislation
🌍 Engagement Challenge: Need to serve all Kenyan citizens for national issues

Our Solution

✅ Secure Anonymous Submissions: True anonymity with bcrypt-hashed national IDs
✅ Invisible Boundaries: Role-based UI where users only see what they're allowed to
✅ National Architecture: Unified platform for all citizens with parliamentary focus
✅ Progressive Enhancement: Build features incrementally without over-engineering

🏗️ System Architecture - "Invisible Boundaries"
Core Philosophy:

Each user experiences a completely different application based on their role. They have zero knowledge of features or data outside their scope.

mermaidgraph TD
    A[User Login] --> B{Role Detection}
    B --> C[Citizen View]
    B --> D[Parliament Admin View]
    B --> E[Anonymous Session]
    
    C --> C1[View Bills & Projects<br/>Submit Feedback<br/>View My Submissions]
    D --> D1[National Dashboard<br/>Manage Bills & Projects<br/>View All Feedback]
    E --> E1[Anonymous Submission<br/>Track with ID]

Security Model

🔐 National Scope: Unified data access for all citizens
🛡️ Role-Based Access: Automatic permission enforcement
👻 Anonymous Users: Zero-identity feedback submission
🚫 404 Not 403: Users never know restricted features exist
🔄 Soft Delete: Data recovery and audit trails

🚀 Quick Start Guide
Prerequisites
bash# System Requirements
Python 3.11+
PostgreSQL 15+
Redis 7+
Git

# Clone the repository
git clone https://github.com/civicAI/civicAI.git
cd civicAI

# Create virtual environment
python -m venv venv
source venv/bin/activate  
# Windows: 
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the PostgreSQL setup script
chmod +x setup_postgres.sh
./setup_postgres.sh

set up the .env

python manage.py makemigrations
python manage.py migrate

python manage.py setup_counties

python manage.py create_civicai_superuser

python manage.py runserver

👥 User Roles & Permissions
RoleLevelAccess ScopeFeaturesCitizen-Own submissions onlyView bills/projects, submit feedback, view own historyAnonymous-Session-basedSubmit feedback, track with IDParliament AdminNationalAll national dataManage bills/projects, view all feedback, respond to citizensSuper AdminSystemFull system accessUser management, system configuration
Permission Matrix
pythonPERMISSIONS = {
    'citizen': ['view_bills_projects', 'submit_feedback', 'view_own_submissions'],
    'anonymous': ['submit_feedback', 'track_submission'],
    'parliament_admin': ['manage_bills_projects', 'view_all_feedback', 'respond_to_feedback'],
    'super_admin': ['full_system_access', 'user_management']
}

🏢 Data Models Overview
Core Models
python# Location Hierarchy
County (47 counties) - for user location only

# User System
CustomUser (bcrypt-hashed national ID) → Role → National Scope

# National Architecture
No tenant isolation - unified national platform
Key Fields

national_id_hash: bcrypt-hashed Kenyan national ID (for login)
tenant: County association (data isolation)
role: Determines entire app experience
is_deleted: Soft delete for all models


🔧 Development Workflow
Branch Strategy
bashmain              # Production-ready code
develop           # Integration branch
feature/xxx       # New features
hotfix/xxx        # Emergency fixes

Code Standards

✅ Models: Always inherit from SoftDeleteModel
✅ Views: Use @invisible_permission_required decorator
✅ APIs: Respect user context and tenant boundaries
✅ Tests: Test each role's access level
✅ Documentation: Update README for new features