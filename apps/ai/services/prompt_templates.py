# =============================================================================
# FILE: apps/ai/services/prompt_templates.py
# =============================================================================
from typing import Dict, List, Optional
from datetime import datetime


class SentimentPrompts:
    """🎭 Carefully crafted prompts for accurate sentiment analysis"""
    
    @staticmethod
    def get_sentiment_analysis_prompt() -> str:
        return """
        Analyze the sentiment of this citizen feedback from Kenya with deep contextual understanding.
        
        Consider the following Kenyan context:
        1. **Cultural Communication Patterns**: 
           - Kenyans may express frustration indirectly through respectful language
           - "Please" and "kindly" are commonly used even when expressing strong dissatisfaction
           - Community concerns often outweigh individual complaints
        
        2. **Language Patterns**: 
           - Mix of English and Swahili expressions
           - Use of titles like "Honorable," "Mheshimiwa" shows respect even when critical
           - Religious references ("God willing," "by God's grace") are common
        
        3. **Civic Engagement Tone**: 
           - Citizens addressing government with expectation of action
           - References to "development" and "progress" are highly valued
           - Mentions of neighboring areas' success indicate frustration
        
        4. **Historical Context**: 
           - County-specific issues and known government promises
           - Seasonal challenges (rains, droughts, school terms)
           - Infrastructure development expectations
        
        **Analysis Instructions:**
        - Sentiment score should reflect the underlying emotion, not just polite language
        - Consider urgency indicators like "urgent," "immediately," "lives at risk"
        - Identify community vs. individual focus
        - Detect hope/despair patterns in language
        
        Provide analysis in this exact JSON format:
        ```json
        {
            "sentiment_score": <float between -1.0 and 1.0>,
            "sentiment_label": "<negative|neutral|positive>",
            "confidence_score": <float between 0.0 and 1.0>,
            "emotion_detected": "<angry|frustrated|hopeful|grateful|worried|disappointed|desperate|determined>",
            "cultural_indicators": "<specific cultural/linguistic patterns noticed>",
            "urgency_indicators": ["<list of phrases indicating urgency>"],
            "citizen_expectation": "<what the citizen expects from government>",
            "communication_style": "<formal|informal|emotional|factual|respectful|direct>",
            "community_focus": <true if affects community, false if individual>,
            "constructive_tone": <true if offers solutions/suggestions, false otherwise>
        }
        ```
        
        **Key Patterns to Recognize:**
        - **Respectful Frustration**: "We respectfully request" + urgent timeline = negative sentiment
        - **Indirect Criticism**: Comparing to other counties/areas = dissatisfaction  
        - **Community Spirit**: "We as residents" = collective concern (higher urgency)
        - **Religious Context**: "God willing" may indicate resignation or hope
        - **Development Language**: "development" mentions = expectation of progress
        """
    
    @staticmethod
    def get_emotion_classification_prompt() -> str:
        return """
        Classify the specific emotion in this Kenyan citizen feedback beyond basic sentiment.
        
        **Kenyan Emotional Expression Patterns:**
        - **Frustrated**: Indirect complaints, comparisons to other areas
        - **Hopeful**: Mentions of future development, trust in government
        - **Desperate**: Urgent health/safety language, "lives at risk"
        - **Grateful**: Acknowledgment of previous government action
        - **Worried**: Concerns about children, elderly, community safety
        - **Determined**: "We will not give up," community organizing language
        - **Disappointed**: References to broken promises, delayed projects
        - **Angry**: Direct criticism (rare in Kenyan civic discourse)
        
        Return JSON with detailed emotion analysis:
        ```json
        {
            "primary_emotion": "<specific emotion>",
            "emotion_intensity": <1-10 scale>,
            "secondary_emotions": ["<list of other emotions detected>"],
            "emotion_triggers": ["<what specifically caused this emotion>"],
            "cultural_expression": "<how the emotion is culturally expressed>"
        }
        ```
        """


class UrgencyPrompts:
    """⚡ Prompts for intelligent urgency scoring with Kenyan context"""
    
    @staticmethod
    def get_urgency_scoring_prompt() -> str:
        return """
        As an expert in Kenyan civic governance, score the urgency of this citizen feedback considering Kenya-specific factors.
        
        **KENYA-SPECIFIC URGENCY FACTORS:**
        
        1. **Infrastructure Urgency (Scale Impact)**:
           - Roads: Impassable during rains = High, Potholes = Medium
           - Water: No access = Critical, Poor quality = High
           - Electricity: Hospital/school affected = Critical, Residential = High
           - Bridges: Collapsed = Critical, Damaged = High
        
        2. **Health and Safety (Immediate Risk)**:
           - Disease outbreak = Critical
           - Hospital equipment failure = Critical  
           - School safety hazards = High
           - Market sanitation = High
           - Crime/security = High to Critical
        
        3. **Community Impact Scale**:
           - Individual household = Low to Medium
           - Neighborhood (50-200 people) = Medium to High
           - Ward (1000+ people) = High to Critical
           - Sub-county (10,000+ people) = Critical
           - Cross-county effects = Critical
        
        4. **Seasonal Factors (Timing Urgency)**:
           - School term starting = Higher urgency for education issues
           - Rainy season = Higher urgency for drainage/roads
           - Dry season = Higher urgency for water issues
           - Election period = Higher urgency for transparency issues
           - Market days = Higher urgency for commercial issues
        
        5. **Political Sensitivity**:
           - Corruption allegations = High (anonymous feedback = Higher)
           - Service delivery failures = Medium to High
           - Resource mismanagement = High
           - Inter-community tensions = High to Critical
        
        6. **Resource Availability in County**:
           - Well-funded counties = Can handle more urgent issues
           - Resource-constrained counties = Adjust expectations
           - Emergency budgets available = Higher response capacity
           - Ongoing projects = May affect response timing
        
        **URGENCY SCALE (1-10):**
        - **9-10 (CRITICAL)**: Emergency requiring immediate action (health/safety risk, large population)
        - **7-8 (HIGH)**: Significant community impact (hundreds affected, infrastructure failure)
        - **5-6 (MEDIUM)**: Important issues (should be addressed within week, local impact)
        - **3-4 (ROUTINE)**: Normal processing timeline (individual issues, maintenance)
        - **1-2 (LOW)**: Can be scheduled (suggestions, minor complaints)
        
        **ESCALATION RISK FACTORS:**
        - Media attention potential
        - Political sensitivity
        - Community organization capacity
        - Historical pattern of similar issues
        - Rainy season amplification
        - Election period sensitivity
        
        Return this exact JSON format:
        ```json
        {
            "urgency_score": <float 1.0-10.0>,
            "urgency_level": "<critical|high|medium|low>",
            "escalation_risk": <probability 0.0-1.0>,
            "reasoning": "<detailed explanation of scoring considering all factors>",
            "time_sensitive_factors": ["<specific time-critical elements>"],
            "community_impact_scale": "<individual|neighborhood|ward|sub_county|county|multi_county>",
            "affected_population_estimate": <number of people affected>,
            "resource_requirements": "<minimal|moderate|significant|major>",
            "similar_issue_precedents": "<how similar issues typically develop>",
            "seasonal_considerations": "<current season impact on urgency>",
            "recommended_response_timeframe": "<immediate|6_hours|24_hours|3_days|1_week>",
            "alert_officials": <true if requires immediate official notification>
        }
        ```
        
        **CRITICAL ALERT TRIGGERS:**
        - Score 9+ = Immediate alert to county officials
        - Health/safety + large population = Immediate alert
        - Escalation risk > 0.8 = Prepare crisis response
        - Infrastructure collapse = Emergency protocols
        """
    
    @staticmethod
    def get_impact_assessment_prompt() -> str:
        return """
        Assess the potential community impact of this feedback issue.
        
        **COMMUNITY IMPACT DIMENSIONS:**
        
        1. **Geographic Scope**:
           - Village: 100-500 people
           - Sub-location: 500-2000 people  
           - Ward: 2000-15000 people
           - Sub-county: 15000-100000 people
           - County: 100000+ people
        
        2. **Service Type Impact**:
           - Water: Affects daily life, health
           - Roads: Affects economic activity, access to services
           - Healthcare: Affects emergency response, maternal health
           - Education: Affects children's future, community development
           - Security: Affects all activities, investment
        
        3. **Economic Impact**:
           - Market access disruption
           - Transportation cost increases
           - Business closure risk
           - Agricultural impact
           - Employment effects
        
        4. **Vulnerable Population Effects**:
           - Children (schools, health, safety)
           - Elderly (healthcare access, mobility)
           - Pregnant women (emergency access)
           - People with disabilities (accessibility)
           - Low-income households (disproportionate impact)
        
        Return detailed impact assessment:
        ```json
        {
            "impact_score": <1-10>,
            "affected_population": <estimated number>,
            "geographic_scope": "<village|sub_location|ward|sub_county|county>",
            "economic_impact": "<minimal|moderate|significant|severe>",
            "vulnerable_groups_affected": ["<list of vulnerable populations>"],
            "service_disruption_level": "<none|partial|significant|complete>",
            "secondary_effects": ["<ripple effects on other services/areas>"],
            "long_term_consequences": "<potential long-term impact if unresolved>"
        }
        ```
        """


class ResponsePrompts:
    """💬 Prompts for generating government responses"""
    
    @staticmethod
    def get_response_generation_prompt(response_type: str) -> str:
        """Get response generation prompt based on type"""
        
        base_context = """
        Generate a government official response that demonstrates:
        
        **KENYAN CIVIC COMMUNICATION BEST PRACTICES:**
        1. **Cultural Respect**: Acknowledge the citizen's concern with appropriate respect
        2. **Clear Communication**: Use simple, clear language (English/Swahili mix where appropriate)
        3. **Practical Next Steps**: Provide specific actions, not vague promises
        4. **Realistic Timelines**: Give achievable timelines based on county capacity
        5. **Empathy and Understanding**: Show understanding of how this affects citizens' daily lives
        6. **Transparency**: Be honest about challenges and limitations
        7. **Community Focus**: Acknowledge broader community impact where relevant
        
        **COMMUNICATION PRINCIPLES:**
        - Acknowledge the citizen's concern immediately and respectfully
        - Provide specific next steps with responsible department/person
        - Give realistic timelines based on actual county capacity and resources
        - Show understanding of local context and cultural sensitivity
        - Use appropriate level of formality (respectful but accessible)
        - Include follow-up mechanism for citizen to stay informed
        - End with appreciation for civic engagement
        
        **AVOID:**
        - Overly bureaucratic language
        - Unrealistic promises or timelines
        - Defensive or dismissive tone
        - Generic responses that could apply to any issue
        - Blame-shifting to other levels of government
        """
        
        type_specific_prompts = {
            'acknowledgment': f"""
            {base_context}
            
            **ACKNOWLEDGMENT RESPONSE (2-3 sentences):**
            Purpose: Immediate response to show the citizen has been heard
            Tone: Warm, professional, reassuring
            
            Structure:
            1. Thank citizen for feedback and civic engagement
            2. Confirm receipt and briefly acknowledge the specific issue
            3. Indicate next steps or timeline for detailed response
            
            Example tone: "Thank you for bringing this important matter to our attention..."
            """,
            
            'information_request': f"""
            {base_context}
            
            **INFORMATION REQUEST RESPONSE (3-4 sentences):**
            Purpose: Request additional details needed to address the issue
            Tone: Professional, helpful, specific
            
            Structure:
            1. Acknowledge the feedback and its importance
            2. Explain what additional information is needed and why
            3. Provide clear instructions on how to provide the information
            4. Set expectation for next steps once information is received
            
            Focus on making it easy for citizens to provide needed details.
            """,
            
            'action_plan': f"""
            {base_context}
            
            **ACTION PLAN RESPONSE (4-6 sentences):**
            Purpose: Outline specific steps the county will take
            Include: Timeline, responsible department, citizen's role if any
            
            Structure:
            1. Acknowledge the issue and its impact on the community
            2. Outline 2-3 specific actions the county will take
            3. Provide realistic timeline for each action
            4. Identify responsible department/official
            5. Explain how citizen will be updated on progress
            6. Include any role the citizen/community can play
            
            Be specific about what will happen and when.
            """,
            
            'status_update': f"""
            {base_context}
            
            **STATUS UPDATE RESPONSE (3-5 sentences):**
            Purpose: Update citizen on progress made since their feedback
            Tone: Informative, transparent about both progress and challenges
            
            Structure:
            1. Reference the original feedback and thank for follow-up
            2. Describe specific progress made to date
            3. Explain any challenges encountered and how they're being addressed
            4. Provide updated timeline for completion
            5. Indicate next update schedule or completion date
            
            Be honest about both successes and setbacks.
            """,
            
            'detailed_explanation': f"""
            {base_context}
            
            **DETAILED EXPLANATION RESPONSE (6-8 sentences):**
            Purpose: Educate citizen about the issue and government process
            Include: Context, challenges, long-term solutions, how citizen can stay informed
            
            Structure:
            1. Acknowledge the feedback and validate citizen concerns
            2. Provide background context on the issue (why it exists, complexity)
            3. Explain current government approach and any ongoing initiatives
            4. Describe specific challenges (budget, coordination, technical)
            5. Outline long-term solution strategy
            6. Explain how this fits into broader county development plans
            7. Provide ways for citizen to stay engaged and informed
            8. Thank citizen for patience and continued engagement
            
            Focus on education while maintaining hope and engagement.
            """,
            
            'resolution': f"""
            {base_context}
            
            **RESOLUTION RESPONSE (4-5 sentences):**
            Purpose: Inform citizen that their issue has been resolved
            Tone: Appreciative, accountable, forward-looking
            
            Structure:
            1. Thank citizen for their patience and for raising the issue
            2. Describe the specific resolution implemented
            3. Provide details on how to verify the resolution or who to contact
            4. Acknowledge community impact and broader benefits
            5. Encourage continued civic engagement and feedback
            
            Celebrate the success while encouraging ongoing participation.
            """
        }
        
        return type_specific_prompts.get(response_type, base_context)
    
    @staticmethod
    def get_empathy_enhancement_prompt() -> str:
        return """
        Enhance this government response to be more empathetic and culturally appropriate for Kenyan citizens.
        
        **EMPATHY ENHANCEMENT GUIDELINES:**
        
        1. **Personal Impact Recognition**:
           - Acknowledge how this affects daily life
           - Recognize emotional impact on families
           - Show understanding of community consequences
        
        2. **Cultural Sensitivity**:
           - Respect for community elders and leaders
           - Understanding of collective responsibility
           - Appreciation for citizen civic engagement
        
        3. **Appropriate Language**:
           - "We understand your frustration..."
           - "This affects many families in your community..."
           - "Your concerns are valid and important..."
           - "We appreciate your patience as we work together..."
        
        4. **Avoid**:
           - Bureaucratic excuses
           - Minimizing citizen concerns
           - Technical jargon without explanation
           - Defensive language
        
        Return enhanced response with empathy score (1-10) and explanation.
        """


class TrendAnalysisPrompts:
    """📊 Prompts for trend analysis and predictions"""
    
    @staticmethod
    def get_trend_analysis_prompt() -> str:
        return """
        Analyze trends in citizen feedback for this Kenyan county and provide insights for government officials.
        
        **TREND ANALYSIS FRAMEWORK:**
        
        1. **Volume Trends**:
           - Feedback submission patterns over time
           - Category-specific volume changes
           - Geographic distribution shifts
           - Seasonal variation patterns
        
        2. **Issue Evolution**:
           - New issues emerging
           - Recurring problems (indicate systemic issues)
           - Issues being resolved (success patterns)
           - Cross-category correlations
        
        3. **Community Sentiment Patterns**:
           - Overall satisfaction trends
           - Category-specific sentiment changes
           - Geographic sentiment variations
           - Response effectiveness impact on sentiment
        
        4. **Predictive Indicators**:
           - Early warning signs for potential crises
           - Resource allocation needs
           - Seasonal preparation requirements
           - Capacity building priorities
        
        **KENYAN CONTEXT CONSIDERATIONS:**
        - **Seasonal Patterns**: Rains (infrastructure), dry season (water), school terms (education)
        - **Economic Cycles**: Market days, agricultural seasons, salary payment patterns
        - **Political Calendar**: Budget cycles, election periods, national holidays
        - **Development Initiatives**: Ongoing projects, new programs, policy changes
        
        Return comprehensive trend analysis:
        ```json
        {
            "trend_summary": "<overview of key trends>",
            "emerging_issues": [
                {
                    "issue": "<description>",
                    "trend_direction": "<increasing|decreasing|stable>",
                    "confidence": <0.0-1.0>,
                    "predicted_timeline": "<when this might become critical>"
                }
            ],
            "success_patterns": [
                {
                    "area": "<what's working well>",
                    "evidence": "<supporting data>",
                    "replication_potential": "<can this be applied elsewhere>"
                }
            ],
            "priority_recommendations": [
                {
                    "recommendation": "<action to take>",
                    "urgency": "<immediate|short_term|long_term>",
                    "resource_requirement": "<low|medium|high>",
                    "expected_impact": "<description of expected outcome>"
                }
            ],
            "seasonal_preparations": {
                "next_30_days": ["<preparations needed>"],
                "next_90_days": ["<medium-term preparations>"],
                "annual_planning": ["<yearly cycle considerations>"]
            },
            "risk_assessment": {
                "high_risk_areas": ["<areas needing attention>"],
                "escalation_indicators": ["<warning signs to watch>"],
                "mitigation_strategies": ["<preventive actions>"]
            }
        }
        ```
        """
    
    @staticmethod
    def get_prediction_prompt() -> str:
        return """
        Based on current trends, predict likely future issues and opportunities for this Kenyan county.
        
        **PREDICTION CATEGORIES:**
        
        1. **Infrastructure Needs**: Based on growth patterns, seasonal stress, aging infrastructure
        2. **Service Gaps**: Emerging service needs, capacity limitations, resource constraints
        3. **Seasonal Challenges**: Predictable seasonal issues requiring preparation
        4. **Community Opportunities**: Areas where quick wins are possible
        5. **Resource Planning**: Budget and staffing needs based on trends
        
        **PREDICTION TIMEFRAMES:**
        - **Next 30 days**: Immediate preparations needed
        - **Next 90 days**: Short-term planning priorities  
        - **Next 12 months**: Annual planning considerations
        - **Long-term (2-3 years)**: Strategic development needs
        
        Focus on actionable predictions that help officials prepare and prevent issues.
        """


class ContextualPrompts:
    """🌍 Context-aware prompts for different scenarios"""
    
    @staticmethod
    def get_crisis_communication_prompt() -> str:
        return """
        Generate crisis communication response for this urgent feedback.
        
        **CRISIS COMMUNICATION PRINCIPLES:**
        1. **Speed**: Respond immediately to show government is aware and acting
        2. **Accuracy**: Provide verified information only
        3. **Empathy**: Acknowledge impact on affected citizens
        4. **Action**: Clearly state immediate steps being taken
        5. **Updates**: Commit to regular updates with specific schedule
        6. **Coordination**: Show coordination between departments/levels
        
        **STRUCTURE:**
        1. Immediate acknowledgment of the crisis
        2. Expression of concern for affected citizens
        3. Summary of immediate response actions taken
        4. Timeline for next steps and updates
        5. Emergency contact information
        6. Request for community cooperation if needed
        
        Keep tone serious but reassuring, factual but empathetic.
        """
    
    @staticmethod
    def get_corruption_response_prompt() -> str:
        return """
        Generate appropriate response to corruption allegation or governance feedback.
        
        **CORRUPTION RESPONSE GUIDELINES:**
        1. **Take Seriously**: Every allegation deserves proper investigation
        2. **Transparency**: Explain investigation process clearly
        3. **Protection**: Assure whistleblower protection
        4. **Accountability**: Commit to appropriate action if wrongdoing found
        5. **Prevention**: Mention systemic improvements being made
        
        **STRUCTURE:**
        1. Thank citizen for courage in reporting
        2. Assure that allegations will be thoroughly investigated
        3. Explain investigation process and timeline
        4. Guarantee protection for those reporting in good faith
        5. Commit to appropriate action based on findings
        6. Mention broader anti-corruption efforts
        
        Tone: Serious, professional, committed to accountability.
        """
    
    @staticmethod
    def get_seasonal_context_prompt(season: str) -> str:
        """Get season-specific context prompts"""
        seasonal_contexts = {
            'rainy': """
            **RAINY SEASON CONTEXT (March-May, October-December):**
            - Infrastructure issues become critical (roads, drainage)
            - Water quality concerns increase
            - School access may be affected
            - Health risks from flooding, waterborne diseases
            - Agricultural opportunities and challenges
            - Transportation disruptions
            
            Adjust urgency scoring and response recommendations for rainy season impacts.
            """,
            
            'dry': """
            **DRY SEASON CONTEXT (June-September, January-February):**
            - Water shortage concerns become critical
            - Dust and air quality issues
            - Fire risk increases
            - Agricultural stress
            - Pastoral community challenges
            - Energy demand increases
            
            Prioritize water and health issues during dry periods.
            """,
            
            'school_term': """
            **SCHOOL TERM CONTEXT:**
            - Education-related issues gain higher priority
            - School infrastructure and safety critical
            - Transportation to schools important
            - Child protection and welfare concerns
            - Teachers and educational resources
            
            Education issues should be expedited during school terms.
            """,
            
            'election_period': """
            **ELECTION PERIOD CONTEXT:**
            - Transparency and accountability especially important
            - Service delivery promises under scrutiny
            - Community tensions may be elevated
            - Development project timelines affected
            - Increased public attention on governance
            
            Handle all feedback with extra sensitivity and transparency.
            """
        }
        
        return seasonal_contexts.get(season, "")


# Utility functions for prompt management
def get_prompt_by_task(task_type: str, **kwargs) -> str:
    """Get appropriate prompt based on task type"""
    prompt_map = {
        'sentiment_analysis': SentimentPrompts.get_sentiment_analysis_prompt,
        'urgency_scoring': UrgencyPrompts.get_urgency_scoring_prompt,
        'response_generation': lambda: ResponsePrompts.get_response_generation_prompt(
            kwargs.get('response_type', 'acknowledgment')
        ),
        'trend_analysis': TrendAnalysisPrompts.get_trend_analysis_prompt,
        'crisis_communication': ContextualPrompts.get_crisis_communication_prompt,
        'corruption_response': ContextualPrompts.get_corruption_response_prompt,
    }
    
    prompt_func = prompt_map.get(task_type)
    if prompt_func:
        return prompt_func()
    else:
        raise ValueError(f"Unknown task type: {task_type}")


def validate_prompt_response(response: str, expected_format: str) -> bool:
    """Validate that LLM response matches expected format"""
    if expected_format == "json":
        try:
            import json
            json.loads(response)
            return True
        except json.JSONDecodeError:
            return False
    elif expected_format == "text":
        return len(response.strip()) > 0
    else:
        return True