# Token Fix Plan


- [x] Update `src/services/api.js` to handle 401 Unauthorized responses
    - [x] Add check for status 401 in `request` function
    - [x] Exclude `/auth/` endpoints from this check
    - [x] Clear localStorage (token, user)
    - [x] Redirect to login page (`/`)
- [ ] Verify the fix (User to test)

