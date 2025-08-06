🇰🇪 CivicAI - Kenya's Civic Feedback Revolution

Empowering 47 counties, 47 million voices. One secure, scalable platform.

🎯 Mission Statement
Transform civic engagement in Kenya by providing a secure, anonymous, and scalable platform where citizens can submit feedback to their county governments while maintaining complete privacy and ensuring government accountability.
The Problem We're Solving

🚫 No Direct Channel: Citizens lack direct communication with county governments
🔒 Fear of Retaliation: People afraid to speak up about local issues
📊 No Data Insights: Governments lack data-driven decision making tools
🌍 Scalability Challenge: Need to serve 47 counties with different needs

Our Solution

✅ Secure Anonymous Submissions: True anonymity with bcrypt-hashed national IDs
✅ Invisible Boundaries: Role-based UI where users only see what they're allowed to
✅ Tenant-Based Architecture: Per-county data isolation with nationwide analytics
✅ Progressive Enhancement: Build features incrementally without over-engineering

🏗️ System Architecture - "Invisible Boundaries"
Core Philosophy:

Each user experiences a completely different application based on their role. They have zero knowledge of features or data outside their scope.

mermaidgraph TD
    A[User Login] --> B{Role Detection}
    B --> C[Citizen View]
    B --> D[Local Official View]
    B --> E[Regional Official View]
    B --> F[National Official View]
    B --> G[Anonymous Session]
    
    C --> C1[Submit Feedback<br/>View My Submissions]
    D --> D1[County Dashboard<br/>Manage Local Feedback]
    E --> E1[Multi-County Analytics<br/>Regional Reports]
    F --> F1[National Overview<br/>All Counties Access]
    G --> G1[Anonymous Submission<br/>Track with ID]

Security Model

🔐 Tenant Isolation: County-based data partitioning
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
RoleLevelAccess ScopeFeaturesCitizen-Own submissions onlySubmit feedback, view own historyAnonymous-Session-basedSubmit feedback, track with IDGovernment OfficialLocalHome county onlyCounty dashboard, respond to feedbackGovernment OfficialRegionalAssigned countiesMulti-county analytics, regional reportsGovernment OfficialNationalAll countiesNational overview, system analyticsSuper AdminSystemFull system accessUser management, system configuration
Permission Matrix
pythonPERMISSIONS = {
    'citizen': ['submit_feedback', 'view_own_submissions'],
    'anonymous': ['submit_feedback', 'track_submission'],
    'local_official': ['view_county_data', 'respond_to_feedback'],
    'regional_official': ['view_multi_county', 'generate_reports'],
    'national_official': ['view_all_counties', 'system_analytics'],
    'super_admin': ['full_system_access', 'user_management']
}

🏢 Data Models Overview
Core Models
python# Location Hierarchy
County (47 counties) → Sub-County → Ward → Village

# User System
CustomUser (bcrypt-hashed national ID) → Role → Tenant (County)

# Tenant Architecture
County = Tenant (data isolation boundary)
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