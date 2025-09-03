# apps/api/citizen_chat_prompts.py
from typing import List, Dict, Optional

# Master system prompt for citizen chat - DO NOT MODIFY
CITIZEN_CHAT_SYSTEM_PROMPT = """You are CivicAI, an AI assistant helping Kenyan citizens understand government bills and legislation.

CRITICAL RULES:
1. **Source Supremacy**: Only use information from the provided bill sections. Never add external knowledge.
2. **Citizen-Focused**: Explain in simple terms how the bill affects ordinary Kenyans ("mwananchi").
3. **No Hallucination**: If information is not in the provided sections, say "This information is not covered in the sections I have access to."
4. **Neutral Tone**: Remain completely neutral. Do not judge if the bill is good or bad.
5. **Practical Focus**: Emphasize practical impacts on daily life, money, rights, and responsibilities.

FORMAT YOUR RESPONSES:
- Start with a direct answer to the user's question
- Explain the relevant bill provisions in simple language
- Mention specific sections/chapters when referencing information
- End with a disclaimer about this being informational only
- Adopt the Use of English or simple Kiswahili depending on the user's language preference


ALWAYS INCLUDE: "This information is based solely on the bill text and is for educational purposes only. For legal advice, consult a qualified professional."
"""


def create_citizen_chat_prompt(user_question: str, relevant_chunks: List[Dict], bill_title: str, conversation_context: Optional[List[Dict]] = None) -> str:
    """
    Create chat prompt for citizen Q&A
    
    Args:
        user_question: Citizen's question
        relevant_chunks: Relevant bill sections
        bill_title: Title of the bill
        conversation_context: Previous conversation history
    Returns:
        str: Complete prompt for AI
    """
    
    # Build the main prompt
    prompt = f"""You are answering a citizen's question about: **{bill_title}**

CITIZEN'S QUESTION: "{user_question}"

RELEVANT BILL SECTIONS TO USE (and ONLY these sections):
"""
    
    # Add relevant chunks
    for i, chunk in enumerate(relevant_chunks, 1):
        prompt += f"""
--- SECTION {i}: {chunk['section_title']} ---
{chunk['processed_content'] or chunk['content'][:1500]}
"""
        if len(chunk['content']) > 1500:
            prompt += "\n[Section continues...]"
        prompt += "\n"
    
    # Add conversation context if available
    if conversation_context and len(conversation_context) > 0:
        prompt += "\nPREVIOUS CONVERSATION CONTEXT (for reference only):\n"
        for exchange in conversation_context[-3:]:  # Last 3 exchanges only
            prompt += f"Previous Q: {exchange.get('question', '')}\n"
            prompt += f"Previous A: {exchange.get('answer', '')[:200]}...\n\n"
    
    # Add specific instructions for this response
    prompt += f"""
INSTRUCTIONS FOR YOUR RESPONSE:
1. Answer the citizen's question using ONLY the bill sections provided above
2. Explain in simple Kenyan English that any citizen can understand
3. Focus on practical impacts: How does this affect the citizen's life, money, rights?
4. If the question asks about something not covered in the sections, say so clearly
5. Reference specific sections when explaining (e.g., "According to the [section name] section...")
6. Be specific about amounts, percentages, dates, and requirements mentioned in the bill
7. If there are penalties or fines, explain them clearly
8. If there are new rights or benefits, explain who gets them and how

RESPONSE STRUCTURE:
- Direct answer to the question
- Simple explanation of relevant provisions
- Practical implications for citizens
- Reference to specific bill sections used
- Required disclaimer

Remember: You are helping ordinary Kenyans understand how this law affects their daily lives. Use simple language and focus on practical impacts.
"""
    
    return prompt


def create_follow_up_prompt(conversation_history: List[Dict], bill_context: Dict) -> str:
    """
    Create prompt for generating follow-up questions
    
    Args:
        conversation_history: Previous Q&A in conversation
        bill_context: Bill information and context
    Returns:
        str: Prompt for generating follow-up questions
    """
    
    prompt = f"""Based on this conversation about "{bill_context.get('title', 'the bill')}", suggest 3-4 relevant follow-up questions that would help the citizen understand the bill better.

CONVERSATION HISTORY:
"""
    
    # Add recent conversation
    for exchange in conversation_history[-3:]:  # Last 3 exchanges
        prompt += f"Q: {exchange.get('question', '')}\n"
        prompt += f"A: {exchange.get('answer', '')[:300]}...\n\n"
    
    prompt += f"""
BILL CONTEXT:
- Title: {bill_context.get('title', '')}
- Complexity: {bill_context.get('complexity_level', 'basic')}
- Key Areas: {', '.join(bill_context.get('key_sections', [])[:5])}

GENERATE 3-4 FOLLOW-UP QUESTIONS that:
1. Build on what was already discussed
2. Help the citizen understand practical impacts
3. Are specific to this bill's content
4. Use simple, direct language
5. Focus on citizen concerns like: costs, rights, obligations, timelines, enforcement

Format as a simple list, one question per line.
"""
    
    return prompt


def create_explanation_prompt(complex_term: str, bill_context: str, citizen_level: str = 'basic') -> str:
    """
    Create prompt for explaining complex legal terms to citizens
    
    Args:
        complex_term: Legal term to explain
        bill_context: Context from the bill where term appears
        citizen_level: 'basic', 'intermediate', or 'advanced'
    Returns:
        str: Explanation prompt
    """
    
    complexity_instructions = {
        'basic': "Use very simple language, like explaining to someone with primary education",
        'intermediate': "Use clear language, like explaining to someone with secondary education", 
        'advanced': "Use precise but accessible language, like explaining to someone with college education"
    }
    
    prompt = f"""Explain this legal term from a Kenyan bill to a citizen:

TERM TO EXPLAIN: "{complex_term}"

CONTEXT FROM BILL:
{bill_context}

EXPLANATION LEVEL: {citizen_level}
{complexity_instructions.get(citizen_level, complexity_instructions['basic'])}

REQUIREMENTS:
1. Define the term in simple language
2. Explain what it means for ordinary citizens
3. Give practical examples if possible
4. Explain the consequences or implications
5. Use Kenyan context and examples where relevant
6. Avoid legal jargon - if you must use legal terms, explain them too

Keep the explanation under 150 words and make it practical and actionable.
"""
    
    return prompt


def create_section_summary_prompt(section_title: str, section_content: str, focus_area: str = 'citizen_impact') -> str:
    """
    Create prompt for summarizing a specific bill section for citizens
    
    Args:
        section_title: Title of the bill section
        section_content: Full content of the section
        focus_area: 'citizen_impact', 'business_impact', 'financial_impact', etc.
    Returns:
        str: Section summary prompt
    """
    
    focus_instructions = {
        'citizen_impact': "Focus on how this affects ordinary citizens in their daily lives",
        'business_impact': "Focus on how this affects businesses, companies, and enterprises",
        'financial_impact': "Focus on costs, fees, taxes, and financial implications", 
        'rights_obligations': "Focus on new rights granted and obligations imposed",
        'enforcement': "Focus on how this will be enforced and what penalties exist"
    }
    
    prompt = f"""Summarize this bill section for Kenyan citizens:

SECTION: {section_title}

SECTION CONTENT:
{section_content}

SUMMARY FOCUS: {focus_instructions.get(focus_area, focus_instructions['citizen_impact'])}

REQUIREMENTS:
1. Start with what this section is about in one sentence
2. List the main provisions that matter to citizens
3. Explain any new requirements, rights, or obligations
4. Mention specific amounts, dates, or percentages
5. Explain enforcement mechanisms and penalties
6. Use bullet points for clarity
7. Keep language simple and practical

FORMAT:
**What this section does:** [One sentence summary]

**Main provisions:**
• [Key point 1]
• [Key point 2] 
• [Key point 3]

**What you need to know:** [Practical implications]
"""
    
    return prompt


def create_comparison_prompt(old_law: str, new_provision: str, bill_title: str) -> str:
    """
    Create prompt for explaining changes from existing law
    
    Args:
        old_law: Description of current/old law
        new_provision: New provision from the bill
        bill_title: Title of the bill
    Returns:
        str: Comparison prompt
    """
    
    prompt = f"""Explain the changes this bill makes to existing law:

BILL: {bill_title}

CURRENT LAW/SITUATION:
{old_law}

NEW PROVISION IN THE BILL:
{new_provision}

EXPLAIN THE CHANGES:
1. What is changing from the current situation?
2. What stays the same?
3. What is completely new?
4. How does this affect citizens who are used to the old way?
5. When do these changes take effect?
6. What do citizens need to do differently?

Use simple language and focus on practical implications. Structure as:

**What's Changing:**
[Clear explanation of the change]

**What This Means for You:**
[Practical implications for citizens]

**What You Need to Do:**
[Action items if any]

**When This Starts:**
[Implementation timeline]
"""
    
    return prompt


def create_step_by_step_prompt(process_description: str, citizen_context: str) -> str:
    """
    Create prompt for explaining procedures step-by-step
    
    Args:
        process_description: Description of process from bill
        citizen_context: Context about who this applies to
    Returns:
        str: Step-by-step explanation prompt
    """
    
    prompt = f"""Break down this process into simple steps for citizens:

PROCESS FROM BILL:
{process_description}

WHO THIS APPLIES TO:
{citizen_context}

CREATE A STEP-BY-STEP GUIDE:
1. Number each step clearly (Step 1, Step 2, etc.)
2. Use simple action words (Apply, Submit, Pay, Wait, etc.)
3. Mention required documents or information
4. Include timeframes and deadlines
5. Mention costs or fees
6. Explain what happens if you don't follow the process
7. Include who to contact or where to go

FORMAT:
**Who needs to do this:** [Brief description]

**Step-by-step process:**

**Step 1:** [Action required]
- What to do: [Specific action]
- What you need: [Documents/information required]
- Time limit: [If applicable]
- Cost: [If applicable]

**Step 2:** [Continue pattern]
...

**Important reminders:**
• [Key warnings or tips]
• [Common mistakes to avoid]
"""
    
    return prompt


# Prompt templates for common question types
QUESTION_TYPE_PROMPTS = {
    'what_is': """The citizen is asking "what is" something. Focus on:
    - Clear definition using bill content
    - Practical examples
    - Who it affects
    - Why it matters to citizens""",
    
    'how_much': """The citizen is asking about costs/amounts. Focus on:
    - Specific amounts from the bill
    - Who pays what
    - When payments are due
    - Penalties for non-payment
    - Any exemptions or reductions""",
    
    'when_does': """The citizen is asking about timing. Focus on:
    - Specific dates from the bill
    - Implementation timeline
    - Deadlines citizens need to know
    - What happens at each stage""",
    
    'who_needs': """The citizen is asking about who is affected. Focus on:
    - Specific groups mentioned in the bill
    - Inclusion and exclusion criteria
    - How to know if it applies to you
    - Different rules for different groups""",
    
    'what_happens': """The citizen is asking about consequences. Focus on:
    - Penalties and fines from the bill
    - Enforcement mechanisms
    - Appeal processes
    - Rights protection measures""",
    
    'how_do_i': """The citizen is asking about procedures. Focus on:
    - Step-by-step process from the bill
    - Required documents
    - Where to go/who to contact
    - Costs and timeframes
    - What to expect at each step"""
}


def get_question_type_instruction(question: str) -> str:
    """
    Identify question type and return specific instruction
    
    Args:
        question: User's question
    Returns:
        str: Specific instruction for this question type
    """
    question_lower = question.lower().strip()
    
    if question_lower.startswith(('what is', 'what are', 'what does')):
        return QUESTION_TYPE_PROMPTS['what_is']
    elif any(phrase in question_lower for phrase in ['how much', 'what cost', 'how expensive', 'what fee']):
        return QUESTION_TYPE_PROMPTS['how_much'] 
    elif any(phrase in question_lower for phrase in ['when does', 'when will', 'what date', 'how long']):
        return QUESTION_TYPE_PROMPTS['when_does']
    elif any(phrase in question_lower for phrase in ['who needs', 'who must', 'who has to', 'who can']):
        return QUESTION_TYPE_PROMPTS['who_needs']
    elif any(phrase in question_lower for phrase in ['what happens if', 'what penalty', 'what fine', 'consequences']):
        return QUESTION_TYPE_PROMPTS['what_happens']
    elif question_lower.startswith(('how do i', 'how can i', 'what steps', 'what process')):
        return QUESTION_TYPE_PROMPTS['how_do_i']
    else:
        return "Answer the citizen's question focusing on practical implications and using simple language."


# Common disclaimer templates
DISCLAIMERS = {
    'standard': "This information is based solely on the bill text and is for educational purposes only. For legal advice, consult a qualified professional.",
    
    'financial': "This information about costs and fees is based solely on the bill text and is for educational purposes only. For financial planning or tax advice, consult a qualified professional.",
    
    'legal_process': "This information about legal processes is based solely on the bill text and is for educational purposes only. For specific legal situations, consult a qualified lawyer.",
    
    'business': "This information about business requirements is based solely on the bill text and is for educational purposes only. For business compliance advice, consult a qualified professional.",
    
    'incomplete': "The sections I have access to may not contain complete information about this topic. This summary is for educational purposes only. For comprehensive information, review the full bill or consult a qualified professional."
}


def get_appropriate_disclaimer(response_content: str, question_context: str) -> str:
    """
    Select appropriate disclaimer based on response content
    
    Args:
        response_content: The generated response content
        question_context: Context of the original question
    Returns:
        str: Appropriate disclaimer
    """
    content_lower = response_content.lower()
    question_lower = question_context.lower()
    
    if any(term in content_lower for term in ['cost', 'fee', 'tax', 'pay', 'money', 'shilling']):
        return DISCLAIMERS['financial']
    elif any(term in content_lower for term in ['court', 'legal', 'lawsuit', 'prosecution', 'appeal']):
        return DISCLAIMERS['legal_process']
    elif any(term in content_lower for term in ['business', 'company', 'license', 'permit', 'compliance']):
        return DISCLAIMERS['business']
    elif any(phrase in content_lower for phrase in ['not covered', 'not mentioned', 'not specified']):
        return DISCLAIMERS['incomplete']
    else:
        return DISCLAIMERS['standard']


# Export key functions and constants
__all__ = [
    'CITIZEN_CHAT_SYSTEM_PROMPT',
    'create_citizen_chat_prompt',
    'create_follow_up_prompt', 
    'create_explanation_prompt',
    'create_section_summary_prompt',
    'create_comparison_prompt',
    'create_step_by_step_prompt',
    'get_question_type_instruction',
    'get_appropriate_disclaimer',
    'QUESTION_TYPE_PROMPTS',
    'DISCLAIMERS'
]
