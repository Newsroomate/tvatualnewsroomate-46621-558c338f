

## Plan: Grant editor_chefe access to leandrovieira007@hotmail.com

**User ID**: `512511d0-ff42-4caf-89c6-bf5a9974895c`
**Current role**: reporter
**Target role**: editor_chefe

### Steps

1. **Update `profiles` table** — Set `role = 'editor_chefe'` for this user
2. **Update `user_roles` table** — Insert or update the role to `editor_chefe`, removing any other roles

Both updates will be done via the Supabase insert/update tool (data operations, not schema changes).

No code changes are needed — the existing permission system will automatically grant all editor_chefe permissions once the role is updated.

