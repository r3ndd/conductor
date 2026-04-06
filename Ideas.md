## Top-level agent switching
- **Agents**: Edit, Plan, Researcher, Architect, Coder, Reviewer, Debugger, Committer
	- Can be configured with different models
- Edit and Plan are the only agents the user talks to directly. Others are subagents
- Plan has only read permissions and can only call Researcher and Architect subagents. However, has access to a tool to save brainstorming documents.
- Edit has full read/write permissions and is the only one that can call Coder, Reviewer, Debugger, and Committer subagents 
- Subagents are called with commands (e.g. `/architect [prompt]`)
	- Switches to respective Edit/Plan agent if not already primary agent
	- Calls that subagent with a persistent, compacted context
		- If agent was previously called before, previous context is compacted and then the new prompt is given
	- User prompt is forwarded verbatim to the subagent, along with relevant high-level context from the primary agent 
		- If no prompt is passed, primary agent determines if it has enough info to prompt the subagent or if it needs to request info from the user
- Plan mode flow
	- `/brainstorm [prompt]` interactively brainstorms with the user
		- When finished, writes finalized plans to `.conductor/plans/` and auto-compacts context
	- `/research [prompt]` calls the Researcher subagent and returns a final answer when finished. Also saves discoveries to `.conductor/research/`. Doesn't compact top-level context because the returned result consumes a very small amount of context.
	- `/architect [prompt]` calls the Architect subagent to write a detailed design document in `.conductor/designs/`
- Edit mode flow
	- `/code [prompt]` calls Coder to write code in line with the prompt and/or a design document.
		- When Coder subagent is finished, Reviewer is automatically called in the same subagent context after compaction. Reviewer makes any necessary adjustments to make the code follow requirements, and removes slop. When finished, runs tests but does not debug.
		- When Reviewer subagent is finished and tests are failing, Debugger is automatically called in the same subagent context after compaction. Debugger iteratively fixes code until it passes unit tests.
		-  When Debugger subagent is finished (or no tests were failing for Reviewer), Committer subagent is automatically called in the same subagent context after compaction. Committer makes commits and then returns a final summary to the Edit agent.

## Recursive Language Models
- Tool only accessible to the Researcher
- Allows for detailed recursive exploration of code, documentation, papers/PDFs, and the .conductor/ project knowledge
- Resources
	- https://arxiv.org/pdf/2512.24601
	- https://github.com/fullstackwebdev/rlm_repl
	- https://github.com/itsrainingmani/opencode-rlm

## Persistent Project Knowledge
- Stored in `.conductor/` and AGENTS.md files
- Brainstorming plans: `.conductor/plans/`
- Research discoveries: `.conductor/research/`
- Architect designs: `.conductor/designs/`
- Memories: AGENTS.md files 
	- Stores markdown documents written by agents
	- Uses built-in AGENTS.md system to load relevant memories when reading files in the associated parent directories
	- During compaction, agent is told to extract and save non-obvious learnings to AGENTS.md files
	- Resources
		- https://github.com/anomalyco/opencode/blob/dev/.opencode/command/learn.md
		- https://github.com/basicmachines-co/basic-memory

## Other plugins/tools/MCP servers
- Codanna
	- Efficient code search
- Context7
	- Up-to-date documentation