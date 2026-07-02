1. Problem Statement
What problem are you solving, and for whom? One short paragraph.

The project we are building is a personal doomscroll tracker that logs daily social media usage. It solves the problem of not realizing how much time doomscrolling takes up of your day. The tracker will aim to make doomscrolling time across various apps (Instagram, Tiktok, Youtube, etc.) visible With various ways of displaying data, like graphs showing usage over time, a pie chart to show percentage of day spent on each app and doomscrolling in total, etc. This project targets anyone with the goal to understand how much time doomscrolling takes up in their day.

2. Proposed Solution
A high-level description of what you're building. Include a rough sketch or description of the UI.

3. User Flows
Walk through the main ways a user interacts with your app. Numbered steps, not prose. For example:

User opens the app and is prompted to log in
After login, they see a dashboard with their weekly stats
They click "Log session" and enter time spent and platform
The dashboard updates to reflect the new entry
4. Architecture
Describe how the system is structured:

Frontend: What does the UI look like? What pages or views are there?
Backend API: What does your server do? List your API endpoints — the HTTP method, the path, what it accepts, and what it returns. Your backend should expose a proper API (e.g. a REST API) that your frontend calls. It should not serve HTML directly or mix frontend and backend logic.
Database: What data are you storing? Include a schema (table names, columns, types, relationships).
This section must include at least one Mermaid diagram. Use whichever diagram type best fits your system — an entity-relationship diagram for your schema, a sequence diagram for a key user flow, or a component/architecture diagram. GitHub renders Mermaid natively in markdown. For example:


5. Tech Stack
List the technologies you're using and justify each choice in one or two sentences. "Everyone uses it" is not a justification. "It's a lightweight Node framework that handles routing with minimal boilerplate, which fits our simple API needs" is.

6. Out of Scope
What are you explicitly not building? This is important — it keeps scope from creeping. List features or use cases you considered but decided to skip for now.

7. Security Considerations
Think through how your app could be abused or how user data could be exposed. You don't need an exhaustive threat model, but you do need to show that you've thought about it. Things to consider:

Authentication & authorization: How do you verify who a user is? How do you ensure a user can only access their own data?
Input validation: What happens if a user submits unexpected or malicious input? (Think: SQL injection, XSS.)
Sensitive data: Are you storing passwords? If so, are you hashing them? Are there any API keys or secrets that should never be in the codebase?
Exposed endpoints: Are any of your API endpoints accessible without authentication that shouldn't be?
For each point, describe what you're doing about it — not just that you're aware of it.

8. Repository Setup
Document how your GitHub repository is configured:

Branch protection: Describe what branch protection rules you've set on main (e.g., requiring PRs before merging, requiring at least one approval). Justify why these rules are useful — don't just list them.
Who has access: Both teammates should be collaborators.
Setting this up is part of the exercise. A repo without branch protection on main will be flagged in review.

9. Open Questions
List anything you're unsure about or haven't figured out yet. These are things to resolve before or during implementation.

10. A Note
This is, for many of you, the first time a senior member of the club is seeing your quality of work. Try to ensure that it is of a high standard, and that you genuinely understand your approach. LLMs can build design docs like this, but often struggle in industry / at scale to build really good design doc - this is one of the few places where humans are still really needed. Practice your problem solving skills and try to write, or at least ideate, the majority of this design doc yourself.