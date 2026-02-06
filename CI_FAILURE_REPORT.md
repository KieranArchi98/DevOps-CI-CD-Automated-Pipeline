# CI Failure Report (Terraform + Frontend Build)

**Date:** 2026-02-06  
**Scope:** GitHub Actions pipeline failures for `terraform fmt -check -recursive` and frontend Docker build (`npm run build`).

## 1) Terraform `fmt -check -recursive` Failure

**Symptom in CI**
- The `terraform fmt -check -recursive` step exits with code 3 and lists multiple `.tf` files, including `main.tf` and module files.

**Root Causes**
1. **Malformed HCL headers**  
   Several Terraform files had missing block headers at the top of the file (e.g., `module "backend" {`, `resource "..." {`, `variable "..." {`).  
   This makes the files invalid HCL, and `terraform fmt` fails immediately.
2. **Formatting drift**  
   Several files were not formatted to Terraform’s canonical style (aligned `=` spacing, normalized line endings). `fmt -check` flags those differences.

**Fix Implemented**
- Restored valid HCL structure by ensuring each file starts with the correct block header.
- Normalized formatting across all `infrastructure/terraform/**/*.tf` and `.tfvars` files to match `terraform fmt` output.
- Added `.gitattributes` to enforce LF for Terraform file types to prevent CRLF reintroducing drift.

**Files Touched**
- `infrastructure/terraform/main.tf`
- `infrastructure/terraform/modules/**`
- `infrastructure/terraform/outputs.tf`
- `infrastructure/terraform/secrets.tf`
- `infrastructure/terraform/variables.tf`
- `infrastructure/terraform/versions.tf`
- `infrastructure/terraform/terraform.tfvars.example`
- `.gitattributes`

---
## 2) Frontend Docker Build Failure (`npm run build`)

**Symptom in CI**
- TypeScript build fails with errors like:
  - `Type 'string | undefined' is not assignable to type 'string'`
  - `Type '{ ... } | undefined' is not assignable to type 'Chat | undefined'`

**Root Cause**
- `ChatArea` expects a `Chat` object with `id: string`, but the code passed `currentConv` directly, which has optional `id`/`_id`.  
  This created a `string | undefined` type for the `id` property, causing strict type-check failures during `next build`.

**Fix Implemented**
- Introduced explicit `ChatMessage` typing and cast API results safely.
- When rendering `ChatArea`, we now build a safe `chat` object only if a valid ID exists, and we ensure `id` and `title` are always strings.
- Added defensive guards to avoid passing undefined IDs into `chatWithLLM` and `getMessages`.

**File Touched**
- `frontend/app/page.tsx`

---
## Expected Outcome After Fixes

- `terraform fmt -check -recursive` passes cleanly.
- Frontend Docker build completes (`npm run build`) with TypeScript validation successful.

If CI still fails after these changes, the next most likely causes are:
1. Cached GitHub Actions workspace still running old commits.
2. Additional TypeScript strict errors in other components.
3. New Terraform files introduced outside this formatting pass.
